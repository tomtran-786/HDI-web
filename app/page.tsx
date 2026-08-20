import { Hero } from "@/components/sections/hero";
import { Stats } from "@/components/sections/stats";
import { Programs } from "@/components/sections/programs";
import { FeaturedCourse } from "@/components/sections/featured-course";
import { Services } from "@/components/sections/services";
import { About } from "@/components/sections/about";
import { Publications } from "@/components/sections/publications";
import { Projects } from "@/components/sections/projects";
import { Conferences } from "@/components/sections/conferences";
import { Teaching } from "@/components/sections/teaching";
import { Contact } from "@/components/sections/contact";

export default function Home() {
  return (
    <>
      {/* services first — the page is services-led, credentials follow as proof */}
      <Hero />
      <Stats />
      <Programs />
      <FeaturedCourse />
      <Services />
      <About />
      <Publications />
      <Projects />
      <Conferences />
      <Teaching />
      <Contact />
    </>
  );
}
