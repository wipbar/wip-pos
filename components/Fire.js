import React from "react";

export default function Fire(props) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .fire {
              font-size: 16px;
              filter: blur(0.02em);
              -webkit-filter: blur(0.02em);
              position: relative;
              width: 140%;
              transform: translate(-14%, 75%);
              height: 2em;
              margin-top: -2em;
              opacity: 0.5;
            }

            .particle {
              animation: rise 1s ease-in infinite;
              background-image: radial-gradient(
                #ff5000 20%,
                rgba(255, 80, 0, 0) 70%
              );
              border-radius: 50%;
              mix-blend-mode: screen;
              opacity: 0;
              position: absolute;
              bottom: 0;
              width: 5em;
              height: 5em;
            }
            .particle:nth-of-type(1) {
              animation-delay: 0.6357775883s;
              left: calc((100% - 5em) * 0);
            }
            .particle:nth-of-type(2) {
              animation-delay: 0.3890104716s;
              left: calc((100% - 5em) * 0.02);
            }
            .particle:nth-of-type(3) {
              animation-delay: 0.697898908s;
              left: calc((100% - 5em) * 0.04);
            }
            .particle:nth-of-type(4) {
              animation-delay: 0.8030301069s;
              left: calc((100% - 5em) * 0.06);
            }
            .particle:nth-of-type(5) {
              animation-delay: 0.1483380151s;
              left: calc((100% - 5em) * 0.08);
            }
            .particle:nth-of-type(6) {
              animation-delay: 0.7929254773s;
              left: calc((100% - 5em) * 0.1);
            }
            .particle:nth-of-type(7) {
              animation-delay: 0.3389618318s;
              left: calc((100% - 5em) * 0.12);
            }
            .particle:nth-of-type(8) {
              animation-delay: 0.3350399285s;
              left: calc((100% - 5em) * 0.14);
            }
            .particle:nth-of-type(9) {
              animation-delay: 0.2480257732s;
              left: calc((100% - 5em) * 0.16);
            }
            .particle:nth-of-type(10) {
              animation-delay: 0.2074083955s;
              left: calc((100% - 5em) * 0.18);
            }
            .particle:nth-of-type(11) {
              animation-delay: 0.5020611144s;
              left: calc((100% - 5em) * 0.2);
            }
            .particle:nth-of-type(12) {
              animation-delay: 0.6621198927s;
              left: calc((100% - 5em) * 0.22);
            }
            .particle:nth-of-type(13) {
              animation-delay: 0.8088028431s;
              left: calc((100% - 5em) * 0.24);
            }
            .particle:nth-of-type(14) {
              animation-delay: 0.2680110414s;
              left: calc((100% - 5em) * 0.26);
            }
            .particle:nth-of-type(15) {
              animation-delay: 0.3121786323s;
              left: calc((100% - 5em) * 0.28);
            }
            .particle:nth-of-type(16) {
              animation-delay: 0.3048330311s;
              left: calc((100% - 5em) * 0.3);
            }
            .particle:nth-of-type(17) {
              animation-delay: 0.9231617902s;
              left: calc((100% - 5em) * 0.32);
            }
            .particle:nth-of-type(18) {
              animation-delay: 0.1857652146s;
              left: calc((100% - 5em) * 0.34);
            }
            .particle:nth-of-type(19) {
              animation-delay: 0.9277505291s;
              left: calc((100% - 5em) * 0.36);
            }
            .particle:nth-of-type(20) {
              animation-delay: 0.7387815422s;
              left: calc((100% - 5em) * 0.38);
            }
            .particle:nth-of-type(21) {
              animation-delay: 0.3951529278s;
              left: calc((100% - 5em) * 0.4);
            }
            .particle:nth-of-type(22) {
              animation-delay: 0.313827026s;
              left: calc((100% - 5em) * 0.42);
            }
            .particle:nth-of-type(23) {
              animation-delay: 0.2815997026s;
              left: calc((100% - 5em) * 0.44);
            }
            .particle:nth-of-type(24) {
              animation-delay: 0.9761050634s;
              left: calc((100% - 5em) * 0.46);
            }
            .particle:nth-of-type(25) {
              animation-delay: 0.9105601179s;
              left: calc((100% - 5em) * 0.48);
            }
            .particle:nth-of-type(26) {
              animation-delay: 0.6237460149s;
              left: calc((100% - 5em) * 0.5);
            }
            .particle:nth-of-type(27) {
              animation-delay: 0.2811180583s;
              left: calc((100% - 5em) * 0.52);
            }
            .particle:nth-of-type(28) {
              animation-delay: 0.3709682381s;
              left: calc((100% - 5em) * 0.54);
            }
            .particle:nth-of-type(29) {
              animation-delay: 0.9205654953s;
              left: calc((100% - 5em) * 0.56);
            }
            .particle:nth-of-type(30) {
              animation-delay: 0.3573308811s;
              left: calc((100% - 5em) * 0.58);
            }
            .particle:nth-of-type(31) {
              animation-delay: 0.4547082071s;
              left: calc((100% - 5em) * 0.6);
            }
            .particle:nth-of-type(32) {
              animation-delay: 0.0541267388s;
              left: calc((100% - 5em) * 0.62);
            }
            .particle:nth-of-type(33) {
              animation-delay: 0.4357358308s;
              left: calc((100% - 5em) * 0.64);
            }
            .particle:nth-of-type(34) {
              animation-delay: 0.7800485268s;
              left: calc((100% - 5em) * 0.66);
            }
            .particle:nth-of-type(35) {
              animation-delay: 0.7795294418s;
              left: calc((100% - 5em) * 0.68);
            }
            .particle:nth-of-type(36) {
              animation-delay: 0.693155356s;
              left: calc((100% - 5em) * 0.7);
            }
            .particle:nth-of-type(37) {
              animation-delay: 0.6190947827s;
              left: calc((100% - 5em) * 0.72);
            }
            .particle:nth-of-type(38) {
              animation-delay: 0.0298908027s;
              left: calc((100% - 5em) * 0.74);
            }
            .particle:nth-of-type(39) {
              animation-delay: 0.1426647797s;
              left: calc((100% - 5em) * 0.76);
            }
            .particle:nth-of-type(40) {
              animation-delay: 0.3634657188s;
              left: calc((100% - 5em) * 0.78);
            }
            .particle:nth-of-type(41) {
              animation-delay: 0.975316494s;
              left: calc((100% - 5em) * 0.8);
            }
            .particle:nth-of-type(42) {
              animation-delay: 0.1841217215s;
              left: calc((100% - 5em) * 0.82);
            }
            .particle:nth-of-type(43) {
              animation-delay: 0.3445346704s;
              left: calc((100% - 5em) * 0.84);
            }
            .particle:nth-of-type(44) {
              animation-delay: 0.3226883481s;
              left: calc((100% - 5em) * 0.86);
            }
            .particle:nth-of-type(45) {
              animation-delay: 0.9484387381s;
              left: calc((100% - 5em) * 0.88);
            }
            .particle:nth-of-type(46) {
              animation-delay: 0.0228093571s;
              left: calc((100% - 5em) * 0.9);
            }
            .particle:nth-of-type(47) {
              animation-delay: 0.2038759147s;
              left: calc((100% - 5em) * 0.92);
            }
            .particle:nth-of-type(48) {
              animation-delay: 0.1692706415s;
              left: calc((100% - 5em) * 0.94);
            }
            .particle:nth-of-type(49) {
              animation-delay: 0.9553530355s;
              left: calc((100% - 5em) * 0.96);
            }
            .particle:nth-of-type(50) {
              animation-delay: 0.4509801469s;
              left: calc((100% - 5em) * 0.98);
            }

            @keyframes rise {
              from {
                opacity: 0;
                transform: translateY(0) scale(1);
              }
              25% {
                opacity: 1;
              }
              to {
                opacity: 0;
                transform: translateY(-4em) scale(0);
              }
            }
          `,
        }}
      />
      <div {...props} className={"fire " + (props.className || "")}>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
    </>
  );
}
