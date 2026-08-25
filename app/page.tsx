import { Hero } from "@/components/sections/hero";
import { FeaturedCourse } from "@/components/sections/featured-course";
import { Services } from "@/components/sections/services";
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Faq } from "@/components/sections/faq";

export default function Home() {
  return (
    <>
      {/* the centre first, then what it offers. The adviser's academic record
          (công bố, dự án, hội thảo, hướng dẫn) is a page of its own at
          /cong-bo, along with the four headline numbers that summarise it.
          `soft` alternates section backgrounds, so moving a section means
          re-checking the flags in components/sections/*.tsx — dropping the
          stats band from here is exactly why Programs..Contact flipped. */}
      <Hero />
      <About />
      <Services />
      <FeaturedCourse />
      <Faq />
      <Contact />
    </>
  );
}
