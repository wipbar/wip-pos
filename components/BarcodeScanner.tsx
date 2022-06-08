import {
  BrowserCodeReader,
  BrowserMultiFormatOneDReader,
  IScannerControls,
} from "@zxing/browser";
import { BarcodeFormat, DecodeHintType, Result } from "@zxing/library";
import React, { ReactElement, useEffect, useMemo, useRef } from "react";

export default function BarcodeScannerComponent({
  onResult,
  onFailure,
  onError,
  width = "100%",
  height = "100%",
}: {
  onResult?: (result: Result) => void;
  onFailure?: (error: unknown) => void;
  onError?: (error: unknown) => void;
  width?: number | string;
  height?: number | string;
  facingMode?: "environment" | "user";
  torch?: boolean;
  delay?: number;
  videoConstraints?: MediaTrackConstraints;
  stopStream?: boolean;
}): ReactElement {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useMemo(() => {
    const hints: Map<DecodeHintType, any> = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_128,
      BarcodeFormat.ITF,
    ]);

    return new BrowserMultiFormatOneDReader(hints, {
      delayBetweenScanSuccess: 2000,
      delayBetweenScanAttempts: 200,
    });
  }, []);
  useEffect(() => {
    const hitmarker = new Audio("/hitmarker.mp3");
    let controls: IScannerControls;
    async function componentDidMount() {
      try {
        const videoInputDevices =
          await BrowserCodeReader.listVideoInputDevices();

        if (videoRef?.current)
          controls = await codeReader.decodeFromVideoDevice(
            videoInputDevices[0].deviceId,
            videoRef.current,
            (result, error) => {
              if (result) {
                hitmarker.play();
                onResult?.(result);
              }
              if (error) onFailure?.(error);
            },
          );
      } catch (error) {
        onError?.(error);
      }
    }
    componentDidMount();

    return () => controls?.stop();
  }, [codeReader]);

  return <video ref={videoRef} width={width} height={height} />;
}
