import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCourses } from "@/lib/actions/courses";
import { auth } from "@clerk/nextjs/server";

const CoursesPreview = async () => {
  const { userId } = await auth();
  const coursesResult = await getCourses({ onlyPublished: true });
  const courses = (coursesResult.courses || []).filter(c => c.isFree).slice(0, 6);

  if (courses.length === 0) return null;

  return (
    <section className="py-24 bg-background">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Free Courses
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start learning with our free courses
            </p>
          </div>
          <Link
            href={userId ? '/dashboard/courses' : '/sign-up'}
            className="text-primary font-medium hover:text-primary/80 transition-colors flex items-center gap-1 group"
          >
            View All Courses <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={userId ? `/dashboard/courses/${course.id}` : '/sign-in'}
              className="group block bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="p-6 border-b border-border/50 bg-muted/30 group-hover:bg-primary/5 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Free
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
              </div>
              <div className="p-6">
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                  {course.description || 'Explore this course to learn more'}
                </p>
                <span className="text-sm font-medium text-primary group-hover:underline decoration-2 underline-offset-4 flex items-center gap-1">
                  Start Learning <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoursesPreview;
