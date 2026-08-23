import { Hero } from "@/components/sections/hero";
import { Stats } from "@/components/sections/stats";
import { Programs } from "@/components/sections/programs";
import { FeaturedCourse } from "@/components/sections/featured-course";
import { Services } from "@/components/sections/services";
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";

export default function Home() {
  return (
    <>
      {/* the centre first, then what it offers. The adviser's academic record
          (công bố, dự án, hội thảo, hướng dẫn) is a page of its own at
          /cong-bo, linked from the adviser block inside <About />.
          `soft` alternates section backgrounds, so moving a section means
          re-checking the flags in components/sections/*.tsx */}
      <Hero />
      <About />
      <Stats />
      <Programs />
      <FeaturedCourse />
      <Services />
      <Contact />
    </>
  );
}
