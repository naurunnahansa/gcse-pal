import Image from "next/image";

const Footer = () => {
  const sections = [
    {
      title: "Product",
      links: ["Features", "Pricing", "Subjects", "How it Works"],
    },
    {
      title: "Company",
      links: ["About", "Blog", "Careers", "Contact"],
    },
    {
      title: "Resources",
      links: ["Help Center", "Community", "Study Tips", "Exam Dates"],
    },
    {
      title: "Legal",
      links: ["Privacy", "Terms", "Cookie Policy", "Accessibility"],
    },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-12">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-1">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center">
                  <Image
                    src="/logo-full.png"
                    alt="GCSEPal"
                    width={64}
                    height={64}
                    className="object-contain"
                    quality={100}
                    priority
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Your AI-powered companion for GCSE success.
              </p>
            </div>

            {sections.map((section) => (
              <div key={section.title}>
                <h4 className="mb-4 text-sm font-semibold">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 border-t border-border pt-8">
            <p className="text-center text-sm text-muted-foreground">
              © 2025 GCSEPal. All rights reserved.
            </p>
          </div>
      </div>
    </footer>
  );
};

export default Footer;