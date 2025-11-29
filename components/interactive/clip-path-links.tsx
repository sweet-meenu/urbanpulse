"use client";
import React from "react";
import {
  SiGoogle,
  SiFirebase,
  SiAndroid,
  SiOpencv,
  SiTensorflow,
  SiKotlin,
  SiMapbox,
  SiUber, // representing generic transport
  SiLeaflet, // representing maps
} from "react-icons/si";
import { useAnimate } from "framer-motion";

export const ClipPathLinks = () => {
  return (
    <div className="bg-zinc-950 py-20 border-y border-white/10">
      <div className="mx-auto max-w-7xl px-4">
        <h3 className="text-center text-2xl font-space font-bold text-white mb-12">
          Powered by Industry Leaders
        </h3>
        <div className="divide-y divide-zinc-800 border border-zinc-800">
          <div className="grid grid-cols-2 divide-x divide-zinc-800">
            <LinkBox Icon={SiGoogle} href="#" />
            <LinkBox Icon={SiFirebase} href="#" />
          </div>
          <div className="grid grid-cols-4 divide-x divide-zinc-800">
            <LinkBox Icon={SiAndroid} href="#" />
            <LinkBox Icon={SiKotlin} href="#" />
            <LinkBox Icon={SiTensorflow} href="#" />
            <LinkBox Icon={SiOpencv} href="#" />
          </div>
          <div className="grid grid-cols-3 divide-x divide-zinc-800">
            <LinkBox Icon={SiMapbox} href="#" />
            <LinkBox Icon={SiUber} href="#" />
            <LinkBox Icon={SiLeaflet} href="#" />
          </div>
        </div>
      </div>
    </div>
  );
};

const NO_CLIP = "polygon(0 0, 100% 0, 100% 100%, 0% 100%)";
const BOTTOM_RIGHT_CLIP = "polygon(0 0, 100% 0, 0 0, 0% 100%)";
const TOP_RIGHT_CLIP = "polygon(0 0, 0 100%, 100% 100%, 0% 100%)";
const BOTTOM_LEFT_CLIP = "polygon(100% 100%, 100% 0, 100% 100%, 0 100%)";
const TOP_LEFT_CLIP = "polygon(0 0, 100% 0, 100% 100%, 100% 0)";

const ENTRANCE_KEYFRAMES = {
  left: [BOTTOM_RIGHT_CLIP, NO_CLIP],
  bottom: [BOTTOM_RIGHT_CLIP, NO_CLIP],
  top: [BOTTOM_RIGHT_CLIP, NO_CLIP],
  right: [TOP_LEFT_CLIP, NO_CLIP],
};

const EXIT_KEYFRAMES = {
  left: [NO_CLIP, TOP_RIGHT_CLIP],
  bottom: [NO_CLIP, TOP_RIGHT_CLIP],
  top: [NO_CLIP, TOP_RIGHT_CLIP],
  right: [NO_CLIP, BOTTOM_LEFT_CLIP],
};

const LinkBox = ({ Icon, href }: { Icon: any; href: string }) => {
  const [scope, animate] = useAnimate();

  const getNearestSide = (e: any) => {
    const box = e.target.getBoundingClientRect();

    const proximityToLeft = {
      proximity: Math.abs(box.left - e.clientX),
      side: "left",
    };
    const proximityToRight = {
      proximity: Math.abs(box.right - e.clientX),
      side: "right",
    };
    const proximityToTop = {
      proximity: Math.abs(box.top - e.clientY),
      side: "top",
    };
    const proximityToBottom = {
      proximity: Math.abs(box.bottom - e.clientY),
      side: "bottom",
    };

    const sortedProximity = [
      proximityToLeft,
      proximityToRight,
      proximityToTop,
      proximityToBottom,
    ].sort((a: any, b: any) => a.proximity - b.proximity);

    return sortedProximity[0].side;
  };

  const handleMouseEnter = (e: any) => {
    const side = getNearestSide(e);
    // @ts-ignore
    animate(scope.current, { clipPath: ENTRANCE_KEYFRAMES[side] });
  };

  const handleMouseLeave = (e: any) => {
    const side = getNearestSide(e);
    // @ts-ignore
    animate(scope.current, { clipPath: EXIT_KEYFRAMES[side] });
  };

  return (
    <a
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative grid h-20 w-full place-content-center sm:h-28 md:h-36 bg-black"
    >
      <Icon className="text-xl sm:text-3xl lg:text-4xl text-zinc-500" />

      <div
        ref={scope}
        style={{ clipPath: BOTTOM_RIGHT_CLIP }}
        className="absolute inset-0 grid place-content-center bg-[#00E676] text-black font-bold"
      >
        <Icon className="text-xl sm:text-3xl md:text-4xl" />
      </div>
    </a>
  );
};
