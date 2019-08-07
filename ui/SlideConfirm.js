import React, { useCallback, useRef } from "react";
import { css } from "emotion";

const maxValue = 150;
const speed = 12;

export default function SlideConfirm({ onConfirm }) {
  const currValue = useRef();
  const rafID = useRef();
  const inputRange = useRef();
  const successHandler = useCallback(() => {
    onConfirm();
    inputRange.current.value = 0;
  }, [onConfirm]);
  const animateHandler = useCallback(() => {
    // update input range
    inputRange.current.value = currValue.current;

    // determine if we need to continue
    if (currValue.current > -1) {
      window.requestAnimationFrame(animateHandler);
    }

    // decrement value
    currValue.current = currValue.current - speed;
  }, []);
  const unlockStartHandler = useCallback(() => {
    // clear raf if trying again
    window.cancelAnimationFrame(rafID.current);

    // set to desired value
    currValue.current = +inputRange.current.value;
  }, []);
  const unlockEndHandler = useCallback(() => {
    // store current value
    currValue.current = +inputRange.current.value;

    // determine if we have reached success or not
    if (currValue.current >= maxValue) {
      successHandler();
    } else {
      rafID.current = window.requestAnimationFrame(animateHandler);
    }
  }, [animateHandler, successHandler]);

  return (
    <input
      type="range"
      defaultValue="0"
      min={0}
      max={maxValue}
      ref={inputRange}
      onMouseDown={unlockStartHandler}
      onTouchStart={unlockStartHandler}
      onMouseUp={unlockEndHandler}
      onTouchEnd={unlockEndHandler}
      className={css`
        width: 10rem;
        appearance: none;

        &:active::-webkit-slider-thumb {
          appearance: none;
          transform: scale(1.1);
          cursor: -webkit-grabbing;
          cursor: -moz-grabbing;
        }
        &:active::-moz-range-thumb {
          border: 0;
          transform: scale(1.1);
          cursor: -webkit-grabbing;
          cursor: -moz-grabbing;
        }
        &:active::-ms-thumb {
          transform: scale(1.1);
          cursor: -webkit-grabbing;
          cursor: -moz-grabbing;
        }
        &:focus {
          outline: none;
        }
        &::-webkit-slider-thumb {
          appearance: none;
          display: block;
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          background: #5990dd;
          transform-origin: 50% 50%;
          transform: scale(1);
          transition: transform ease-out 100ms;
          cursor: -webkit-grab;
          cursor: -moz-grab;
        }
        &::-moz-range-thumb {
          border: 0;
          display: block;
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          background: #5990dd;
          transform-origin: 50% 50%;
          transform: scale(1);
          transition: transform ease-out 100ms;
          cursor: -webkit-grab;
          cursor: -moz-grab;
        }
        &::-ms-thumb {
          display: block;
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          background: #5990dd;
          transform-origin: 50% 50%;
          transform: scale(1);
          transition: transform ease-out 100ms;
          cursor: -webkit-grab;
          cursor: -moz-grab;
        }
        &::-webkit-slider-runnable-track {
          height: 1rem;
          padding: 0.25rem;
          box-sizing: content-box;
          border-radius: 1rem;
          background-color: #dde0e3;
        }
        &::-moz-range-track {
          height: 1rem;
          padding: 0.25rem;
          box-sizing: content-box;
          border-radius: 1rem;
          background-color: #dde0e3;
        }
        &::-moz-focus-outer {
          border: 0;
        }
        &::-ms-track {
          border: 0;
          height: 1rem;
          padding: 0.25rem;
          box-sizing: content-box;
          border-radius: 1rem;
          background-color: #dde0e3;
          color: transparent;
        }
        &::-ms-fill-lower,
        &::-ms-fill-upper {
          background-color: transparent;
        }
        &::-ms-tooltip {
          display: none;
        }
      `}
    />
  );
}
