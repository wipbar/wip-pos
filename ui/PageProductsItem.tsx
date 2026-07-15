import { css } from "@emotion/css";
import { faBan } from "@fortawesome/free-solid-svg-icons/faBan";
import { faFolderMinus } from "@fortawesome/free-solid-svg-icons/faFolderMinus";
import { faFolderPlus } from "@fortawesome/free-solid-svg-icons/faFolderPlus";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";
import convert from "convert";
import omit from "lodash/omit";
import { useFind } from "meteor/react-meteor-data";
import { lazy, type ReactNode, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import ReactSelect, { createFilter } from "react-select";
import CreatableSelect from "react-select/creatable";
import { isUserResponsible } from "../api/accounts";
import Locations, { type ILocation } from "../api/locations";
import Products, {
  getProductABV,
  getProductBarCode,
  getProductBrandName,
  getProductDescription,
  getProductName,
  getProductSize,
  type IProduct,
  isAlcoholic,
} from "../api/products";
import Stocks, { type StockID } from "../api/stocks";
import FontAwesomeIcon from "../components/FontAwesomeIcon";
import { packageTypes } from "../data";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useCurrentUser from "../hooks/useCurrentUser";
import useMethod from "../hooks/useMethod";
import { catchNaN, emptyArray, floor5, units } from "../util";
import { Modal } from "./PageProducts";

const PageStockItem = lazy(() => import("./PageStockItem"));

const toOptions = (items: string[]) =>
  items.map((item) => ({ label: item, value: item }));

const Label = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode | ReactNode[];
}) => (
  <div
    className={css`
      display: flex;
      width: 480px;
      align-items: center;
      > div > input {
        width: 100%;
      }
    `}
  >
    <small
      className={css`
        flex: 0.33;
        text-align: right;
        margin-right: 4px;
      `}
    >
      {label}:
    </small>
    <div
      className={css`
        flex: 1;
        display: flex;
        > * {
          flex: 50%;
        }
      `}
    >
      {children}
    </div>
  </div>
);
export default function PageProductsItem({
  onCancel,
  product,
  defaultValues,
}: {
  onCancel: () => void;
  product?: IProduct;
  defaultValues?: Partial<IProduct>;
}) {
  const currentUser = useCurrentUser();
  const locations = useFind(() => Locations.find(), []);
  const { location } = useCurrentLocation();
  const [addProduct] = useMethod("Products.addProduct");
  const [editProduct] = useMethod("Products.editProduct");
  const [isEditingStock, setIsEditingStock] = useState<null | StockID>(null);
  const products = useFind(() => Products.find(), []);
  const stocks = useFind(() => Stocks.find(), []);

  const allTags = useMemo(
    () =>
      Array.from(
        products.reduce((memo, product) => {
          product.tags?.forEach((tag) => memo.add(tag.trim()));

          return memo;
        }, new Set<string>()),
      ).filter(Boolean),
    [products],
  );
  const allBrandNames = useMemo(
    () =>
      Array.from(
        [...products, ...stocks].reduce((memo, doc) => {
          if (doc.brandName) memo.add(doc.brandName);

          return memo;
        }, new Set<string>()),
      ).filter(Boolean),
    [products, stocks],
  );

  const {
    handleSubmit,
    register,
    control,
    reset,
    watch,
    formState: { isDirty, isSubmitting },
    setValue,
  } = useForm<
    Partial<IProduct> & {
      name: string | null;
      brandName: string | null;
      buyPrice: number;
    }
  >({
    defaultValues: {
      components: product?.components,
      brandName: product?.brandName,
      name: product?.name,
      description: product?.description,
      ...defaultValues,
    },
  });

  const { fields, append, update, remove } = useFieldArray({
    control,
    name: "components",
  });

  const isOnMenu = location && product?.locationIds?.includes(location?._id);

  const components = watch("components");
  const abv = watch("abv");
  const unitSize = watch("unitSize");
  const sizeUnit = watch("sizeUnit");
  const name = watch("name");
  const brandName = watch("brandName");

  const nameDerivedFromComponents = useMemo(
    () => getProductName({ name, components }, stocks),
    [name, components, stocks],
  );
  const brandNameDerivedFromComponents = useMemo(
    () => getProductBrandName({ brandName, components }, stocks),
    [brandName, components, stocks],
  );
  const sizeDerivedFromComponents = useMemo(
    () => getProductSize({ components, unitSize, sizeUnit }),
    [components, unitSize, sizeUnit],
  );
  const abvDerivedFromComponents = useMemo(
    () => getProductABV({ abv, components }, stocks),
    [abv, components, stocks],
  );

  const watchedDescription = watch("description");
  const descriptionDerivedFromComponents = useMemo(
    () =>
      getProductDescription(
        { description: watchedDescription, components },
        stocks,
      ),
    [components, stocks, watchedDescription],
  );

  const componentCosts = (() =>
    components?.map((component) => {
      const stock = stocks.find(({ _id }) => _id === component.stockId);
      if (!stock) return NaN;
      const mostRecentBuyPrice =
        stock.levels?.sort(
          (a, b) => Number(b.timestamp) - Number(a.timestamp),
        )?.[0]?.buyPrice ??
        product?.shopPrices?.sort(
          (a, b) => Number(b.timestamp) - Number(a.timestamp),
        )?.[0]?.buyPrice;

      if (!mostRecentBuyPrice) return NaN;

      const costPerUnit = mostRecentBuyPrice / stock.unitSize;
      const componentCost = catchNaN(() =>
        convert(component.unitSize, component.sizeUnit).to(stock.sizeUnit),
      );

      return costPerUnit * componentCost;
    }))();
  const suggestedPrice = (() => {
    const totalCost = componentCosts?.reduce((sum, cost) => sum + cost, 0);

    if (!totalCost || Number.isNaN(totalCost)) return undefined;

    return floor5(totalCost * 2 * 1.25);
  })();
  const suggestPriceMissingComponentPrices = componentCosts?.some(
    (cost) => !cost,
  );

  return (
    <>
      {isEditingStock ? (
        <Modal onDismiss={() => setIsEditingStock(null)}>
          <PageStockItem
            onCancel={() => setIsEditingStock(null)}
            stock={stocks.find(({ _id }) => _id === isEditingStock)}
          />
        </Modal>
      ) : null}
      <form
        onSubmit={handleSubmit(async (data) => {
          if (!product) {
            await addProduct({ data: { ...data, tap: data.tap || null } });
          } else if (product) {
            await editProduct({
              productId: product._id,
              data: { ...data, tap: data.tap || null },
            });
          }
          onCancel?.();
          reset();
        })}
        className={css`
          display: flex;
          flex-direction: column;
          align-content: center;
        `}
      >
        <Label label="Brand">
          {watch("brandName") != null || components?.length !== 1 ? (
            <div
              className={css`
                display: flex;
              `}
            >
              <Controller
                name="brandName"
                control={control}
                rules={{ required: true }}
                defaultValue={product?.brandName || ""}
                render={({ field: { onBlur, value } }) => (
                  <CreatableSelect
                    required
                    value={value ? { value, label: value } : null}
                    isClearable
                    options={toOptions(allBrandNames || emptyArray)}
                    onBlur={onBlur}
                    onChange={(option) =>
                      setValue("brandName", option?.value || "", {
                        shouldDirty: true,
                      })
                    }
                    className={css`
                      color: black;
                      flex: 1;
                    `}
                  />
                )}
              />
              {components?.length === 1 &&
              stocks.find(({ _id }) => _id === components[0]!.stockId)
                ?.brandName ? (
                <button
                  type="button"
                  onClick={() => {
                    setValue("brandName", null, { shouldDirty: true });
                  }}
                  className={css`
                    flex: 0.25;
                  `}
                >
                  auto
                </button>
              ) : null}
            </div>
          ) : (
            <div>
              {brandNameDerivedFromComponents}
              <button
                type="button"
                onClick={() => {
                  setValue(
                    "brandName",
                    product?.brandName ??
                      brandNameDerivedFromComponents ??
                      null,
                    { shouldDirty: true },
                  );
                }}
              >
                <FontAwesomeIcon icon={faPencilAlt} />
              </button>
            </div>
          )}
        </Label>
        <Label label="Name">
          {watch("name") == null && nameDerivedFromComponents ? (
            <div>
              <code>{nameDerivedFromComponents}</code>
              <small> (via component)</small>{" "}
              <button
                type="button"
                onClick={() => {
                  setValue(
                    "name",
                    product?.name ?? nameDerivedFromComponents ?? "",
                    { shouldDirty: true },
                  );
                }}
              >
                <FontAwesomeIcon icon={faPencilAlt} />
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                defaultValue={product?.name || ""}
                {...register("name")}
              />
              {nameDerivedFromComponents && components?.length ? (
                <button
                  type="button"
                  onClick={() => {
                    setValue("name", null, { shouldDirty: true });
                  }}
                  className={css`
                    flex: 0.25;
                  `}
                >
                  auto
                </button>
              ) : null}
            </>
          )}
        </Label>
        <Label label="Price">
          <input
            required
            type="number"
            placeholder={
              (suggestedPrice
                ? `Suggested: ${suggestedPrice.toLocaleString("en-DK", {
                    maximumFractionDigits: 2,
                  })}`
                : "") +
              (suggestPriceMissingComponentPrices
                ? "(! missing component prices)"
                : "")
            }
            step="any"
            defaultValue={product?.salePrice ?? ""}
            {...register("salePrice", { required: true, valueAsNumber: true })}
          />
        </Label>
        <Label label="Unit Size">
          {sizeDerivedFromComponents &&
          (watch("unitSize") === null ||
            watch("unitSize") === "" ||
            Number.isNaN(watch("unitSize"))) ? (
            <div>
              <code>
                {sizeDerivedFromComponents.unitSize.toLocaleString("en-DK", {
                  maximumFractionDigits: 2,
                })}{" "}
                {sizeDerivedFromComponents.sizeUnit}
              </code>
              <small> (via components)</small>{" "}
              <button
                type="button"
                onClick={() => {
                  setValue("unitSize", sizeDerivedFromComponents.unitSize, {
                    shouldDirty: true,
                  });
                  setValue("sizeUnit", sizeDerivedFromComponents.sizeUnit, {
                    shouldDirty: true,
                  });
                }}
              >
                <FontAwesomeIcon icon={faPencilAlt} />
              </button>
            </div>
          ) : (
            <>
              <input
                required={!product?.components?.length}
                type="number"
                step="any"
                defaultValue={product?.unitSize ?? ""}
                {...register("unitSize", { valueAsNumber: true })}
              />
              <Controller
                name="sizeUnit"
                control={control}
                defaultValue={product?.sizeUnit}
                render={({ field: { onBlur, value } }) => (
                  <ReactSelect
                    isDisabled={
                      watch("unitSize") === "" ||
                      watch("unitSize") === null ||
                      Number.isNaN(watch("unitSize"))
                    }
                    value={value && { value: value, label: value }}
                    options={units.map((code) => ({
                      value: code,
                      label: code,
                    }))}
                    onBlur={onBlur}
                    onChange={(newValue) =>
                      setValue("sizeUnit", newValue?.value, {
                        shouldDirty: true,
                      })
                    }
                  />
                )}
              />
              {sizeDerivedFromComponents && components?.length ? (
                <button
                  type="button"
                  onClick={() => {
                    setValue("unitSize", null, { shouldDirty: true });
                    setValue("sizeUnit", null, { shouldDirty: true });
                  }}
                  className={css`
                    flex: 0.25;
                  `}
                >
                  auto
                </button>
              ) : null}
            </>
          )}
        </Label>
        <Label label="Alcohol %">
          {watch("abv") === null || Number.isNaN(watch("abv")) ? (
            <div>
              <code>
                {(abvDerivedFromComponents || 0).toLocaleString("en-DK", {
                  maximumSignificantDigits: 2,
                })}
                %
              </code>
              <small> (via components)</small>{" "}
              <button
                type="button"
                onClick={() => {
                  setValue("abv", abvDerivedFromComponents || 0, {
                    shouldDirty: true,
                  });
                }}
              >
                <FontAwesomeIcon icon={faPencilAlt} />
              </button>
            </div>
          ) : (
            <>
              <input
                type="number"
                step="any"
                defaultValue={product?.abv ?? ""}
                {...register("abv", { valueAsNumber: true })}
              />
              {abvDerivedFromComponents && components?.length ? (
                <button
                  type="button"
                  onClick={() => {
                    setValue("abv", null, { shouldDirty: true });
                  }}
                  className={css`
                    flex: 0.25;
                  `}
                >
                  auto
                </button>
              ) : null}
            </>
          )}
        </Label>
        <Label label="Description">
          {watch("description") == null ? (
            <div>
              <code>{descriptionDerivedFromComponents}</code>
              <small> (via component)</small>{" "}
              <button
                type="button"
                onClick={() => {
                  setValue(
                    "description",
                    product?.description ?? descriptionDerivedFromComponents,
                    { shouldDirty: true },
                  );
                }}
              >
                <FontAwesomeIcon icon={faPencilAlt} />
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                defaultValue={product?.description || ""}
                {...register("description")}
              />
              {descriptionDerivedFromComponents && components?.length ? (
                <button
                  type="button"
                  onClick={() => {
                    setValue("description", null, { shouldDirty: true });
                  }}
                  className={css`
                    flex: 0.25;
                  `}
                >
                  auto
                </button>
              ) : null}
            </>
          )}
        </Label>
        <Label label="Bar Code">
          {product?.components?.length === 1 &&
          product?.components?.some(
            (component) =>
              stocks.find(({ _id }) => _id === component.stockId)?.barCode,
          ) ? (
            <div>
              <code>{getProductBarCode(product, stocks)}</code>
              <small> (via stock)</small>
            </div>
          ) : product?.barCode ? (
            <div>
              <code>{getProductBarCode(product, stocks)}</code>
              <small> (legacy entry)</small>
            </div>
          ) : (
            <div>
              <code>No Bar Code</code>
              {product?.components?.length === 1 ? (
                <small> (via component)</small>
              ) : null}
            </div>
          )}
        </Label>
        <Label label="Tags">
          <Controller
            name="tags"
            control={control}
            defaultValue={product?.tags}
            render={({ field: { onBlur, value } }) => (
              <CreatableSelect
                value={value ? toOptions(value) : null}
                options={toOptions(allTags || emptyArray)}
                isMulti
                onBlur={onBlur}
                className={css`
                  color: black;
                `}
                onChange={(newValue) =>
                  setValue(
                    "tags",
                    newValue?.map(({ value }) => String(value)) || emptyArray,
                    { shouldDirty: true },
                  )
                }
              />
            )}
          />
        </Label>
        {watch("tags")?.includes("tap") ? (
          <Label label="Tap">
            <select defaultValue={product?.tap || ""} {...register("tap")}>
              <option value="">---</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
              <option value="11">11</option>
              <option value="12">12</option>
            </select>
          </Label>
        ) : null}
        {isUserResponsible(currentUser) ? (
          <Label label="Unit Cost">
            <input
              type="number"
              step="any"
              {...register("buyPrice", { valueAsNumber: true })}
            />
            <small>
              <ul
                className={css`
                  padding: 0;
                  padding-left: 16px;
                  margin: 0;
                `}
              >
                {Array.from(product?.shopPrices || emptyArray)
                  .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
                  .map(({ timestamp, buyPrice }) => (
                    <li
                      key={String(timestamp)}
                    >{`${buyPrice} kr. as of ${new Intl.DateTimeFormat(
                      "da-DK",
                      {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        second: "numeric",
                      },
                    ).format(timestamp)}`}</li>
                  ))}
              </ul>
            </small>
          </Label>
        ) : null}
        <fieldset>
          <legend>Components From Stock</legend>
          {fields.map((field, index) => {
            const stock = stocks.find(({ _id }) => _id === field.stockId);
            if (!stock) return "???";
            return (
              <fieldset key={field.id}>
                <legend
                  className={css`
                    flex: 1;
                    width: 100%;
                    display: flex;
                  `}
                >
                  <ReactSelect
                    value={{
                      label: `${stock.brandName} ${stock.name} (${
                        stock.unitSize
                      }${stock.sizeUnit}, ${packageTypes.find(
                        ({ code }) => stock.packageType === code,
                      )?.name})`,
                      value: stock._id,
                      barCode: stock.barCode,
                    }}
                    filterOption={createFilter({
                      stringify: (option) =>
                        `${option.label} ${option.value} ${
                          option.data?.barCode || ""
                        }`,
                    })}
                    options={stocks
                      .filter(
                        ({ _id }) =>
                          !fields.length ||
                          fields.some(({ stockId }) => stockId !== _id),
                      )
                      .map((stock) => ({
                        label: `${stock.brandName || ""} ${stock.name} (${
                          stock.unitSize
                        }${stock.sizeUnit}, ${packageTypes.find(
                          ({ code }) => stock.packageType === code,
                        )?.name})`,
                        value: stock._id,
                        barCode: stock.barCode,
                      }))}
                    onChange={(newValue) => {
                      const stock = stocks.find(
                        ({ _id }) => _id === newValue?.value,
                      );
                      if (stock) {
                        update(index, {
                          stockId: stock._id,
                          unitSize: field.unitSize,
                          sizeUnit: field.sizeUnit,
                        });
                      }
                    }}
                    className={css`
                      width: 100%;
                    `}
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      setIsEditingStock(stock._id);
                    }}
                    type="button"
                  >
                    <FontAwesomeIcon icon={faPencilAlt} />
                  </button>
                </legend>
                <div
                  className={css`
                    display: flex;
                  `}
                >
                  <input
                    required
                    {...register(`components.${index}.unitSize`, {
                      required: true,
                      valueAsNumber: true,
                    })}
                    step="any"
                    type="number"
                    className={css`
                      flex: 1;
                    `}
                  />
                  <Controller
                    name={`components.${index}.sizeUnit`}
                    control={control}
                    render={({ field: { onBlur, value } }) => (
                      <ReactSelect
                        required
                        value={value && { value: value, label: value }}
                        options={units.map((code) => ({
                          value: code,
                          label: code,
                        }))}
                        onBlur={onBlur}
                        onChange={(newValue) => {
                          const newSizeUnit = newValue?.value;
                          if (newSizeUnit)
                            setValue(
                              `components.${index}.sizeUnit`,
                              newSizeUnit,
                              { shouldDirty: true },
                            );
                        }}
                      />
                    )}
                  />
                  <button type="button" onClick={() => remove(index)}>
                    <small>Remove</small>
                  </button>
                </div>
                {stock.approxCount !== null ? (
                  <>
                    (~
                    {(
                      (stock.approxCount * stock.unitSize) /
                      catchNaN(() =>
                        convert(
                          watch(`components.${index}.unitSize`)!, // ong
                          field.sizeUnit,
                        ).to(stock.sizeUnit),
                      )
                    ).toLocaleString("en-DK", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    servings left)
                  </>
                ) : null}
              </fieldset>
            );
          })}
          <ReactSelect
            value={null}
            placeholder={
              fields.length ? "Additional component..." : "Add component..."
            }
            filterOption={createFilter({
              stringify: (option) =>
                `${option.label} ${option.value} ${option.data?.barCode || ""}`,
            })}
            options={stocks
              .filter(
                ({ _id }) =>
                  !fields.length ||
                  fields.some(({ stockId }) => stockId !== _id),
              )
              .map((stock) => ({
                label: `${stock.brandName || ""} ${stock.name} (${
                  stock.unitSize
                }${stock.sizeUnit}, ${packageTypes.find(
                  ({ code }) => stock.packageType === code,
                )?.name})`,
                value: stock._id,
                barCode: stock.barCode,
              }))}
            onChange={(newValue) => {
              const stock = stocks.find(({ _id }) => _id === newValue?.value);
              if (stock) {
                append({
                  stockId: stock._id,
                  unitSize: Number(watch("unitSize")) || stock.unitSize,
                  sizeUnit: watch("sizeUnit") || stock.sizeUnit,
                });
                if (!watch("brandName")) {
                  setValue("brandName", null, { shouldDirty: true });
                }
              }
            }}
            className={css`
              color: black;
            `}
          />
        </fieldset>
        <hr />
        <div
          className={css`
            display: flex;
            justify-content: space-around;
          `}
        >
          <button
            disabled={!isDirty}
            type="submit"
            className={css`
              width: 200px;
            `}
          >
            {product ? "Update Product" : "Create Product"}{" "}
            {isSubmitting ? "..." : ""}
          </button>

          {product ? (
            <>
              <button
                onClick={async () => {
                  if (!product) return;
                  if (
                    !confirm(
                      `Are you sure you want to clone ${nameDerivedFromComponents}?`,
                    )
                  )
                    return;
                  await addProduct({ data: { ...omit(product, ["_id"]) } });

                  onCancel?.();
                }}
                type="button"
                className={css`
                  width: 200px;
                `}
              >
                Clone Product
              </button>
              <button
                onClick={async () => {
                  if (!location) return;

                  await editProduct({
                    productId: product._id,
                    data: isOnMenu
                      ? {
                          locationIds: product.locationIds?.filter(
                            (id) => id !== location._id,
                          ),
                        }
                      : {
                          locationIds: [
                            ...(product.locationIds || emptyArray),
                            location._id,
                          ],
                        },
                  });
                }}
                type="button"
                disabled={location?.curfew && isAlcoholic(product)}
                style={{
                  background:
                    location?.curfew && isAlcoholic(product)
                      ? "gray"
                      : isOnMenu
                      ? "red"
                      : "limegreen",
                  color: "white",
                }}
              >
                <FontAwesomeIcon
                  icon={
                    location?.curfew && isAlcoholic(product)
                      ? faBan
                      : isOnMenu
                      ? faFolderMinus
                      : faFolderPlus
                  }
                />{" "}
                Menu
              </button>
            </>
          ) : null}
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
        <div>
          {product?.locationIds?.filter((id) => id !== location?._id).length ? (
            <small>
              <br />
              Product is on the menu at:{" "}
              {product?.locationIds
                ?.filter((id) => id !== location?._id)
                .map((id) => locations.find(({ _id }) => id === _id))
                .filter((location): location is ILocation => Boolean(location))
                .map(({ slug, name }) => <span key={slug}>{name}</span>)}
            </small>
          ) : null}
        </div>
      </form>
    </>
  );
}
