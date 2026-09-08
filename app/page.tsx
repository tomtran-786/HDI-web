import { Hero } from "@/components/sections/hero";
import { OpenCourses } from "@/components/sections/open-courses";
import { ConferenceProgram } from "@/components/sections/conference-program";
import { Services } from "@/components/sections/services";
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Faq } from "@/components/sections/faq";

export default async function Home() {
  const openCourses = await OpenCourses();

  return (
    <>
      {/* the centre first, then what it offers. The adviser's academic record
          (công bố, dự án, hội thảo, hướng dẫn) is a page of its own at
          /cong-bo, along with the four headline numbers that summarise it.
          `soft` alternates section backgrounds, so moving a section means
          re-checking the flags in components/sections/*.tsx — dropping the
          stats band from here is exactly why Programs..Contact flipped.
          ConferenceProgram is a teaser after the courses; its full detail
          lives at /hoi-thao-quoc-te. It stays `soft` with no downstream flips:
          the courses block above is conditional, so when it is hidden the
          Hero → soft → plain rhythm still holds. */}
      <Hero />
      {openCourses}
      <ConferenceProgram />
      <About />
      <Services />
      <Faq />
      <Contact />
    </>
  );
}
