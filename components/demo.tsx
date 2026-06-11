"use client";
import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import Image from "next/image";

export function HeroScrollDemo() {
  return (
    <div className="flex flex-col overflow-hidden pb-[500px] pt-[1000px]">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-4xl font-semibold text-black dark:text-white">
              Discover Cinematic Masterpieces <br />
              <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none text-emerald-500">
                With Next-Gen 3D
              </span>
            </h1>
          </>
        }
      >
        <Image
          // Filled with a high-quality cinematic Unsplash image as requested
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=3840&auto=format&fit=crop"
          alt="hero"
          height={720}
          width={1400}
          className="mx-auto rounded-2xl object-cover h-full object-left-top"
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
}
