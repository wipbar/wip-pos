import { css } from "@emotion/css";
import React from "react";
import { IStock, stocksMethods } from "../api/stocks";
import useMethod from "../hooks/useMethod";

export default function PageStockItemStock({
  onCancel,
  stock,
}: {
  onCancel: () => void;
  stock?: IStock;
}) {
  const [takeStock] =
    useMethod<Parameters<(typeof stocksMethods)["Stock.takeStock"]>[0]>(
      "Stock.takeStock",
    );

  return (
    <fieldset
      className={css`
        display: flex;
        flex-direction: column;
        align-content: center;
      `}
    >
      <legend>{stock?.name} Stock Levels</legend>
      {stock?.levels?.map((level, i) => (
        <div
          key={i}
          className={css`
            display: flex;
            justify-content: space-between;
            align-items: center;
          `}
        >
          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
            `}
          >
            <div
              className={css`
                margin-bottom: 4px;
              `}
            >
              {String(level.timestamp)} - {String(level.count)}
            </div>
          </div>
        </div>
      ))}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!stock) return;

          const countInput = e.currentTarget.elements.namedItem("count");
          if (countInput instanceof HTMLInputElement) {
            await takeStock({
              stockId: stock._id,
              count: countInput.valueAsNumber,
            });
            countInput.value = "";
          }
        }}
      >
        <input
          required
          name="count"
          type="number"
          placeholder="New Stock Level"
        />
        <button>Take Stock</button>
      </form>
      <hr />
      <div
        className={css`
          display: flex;
          justify-content: space-around;
        `}
      >
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </fieldset>
  );
}
