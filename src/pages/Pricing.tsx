import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const navigate = useNavigate();

  const creditPackages = [
    {
      name: "Starter Pack",
      credits: 10,
      price: "$9.99",
      description: "Perfect for trying out features",
      perCredit: "$1.00",
      popular: false,
    },
    {
      name: "Creator Pack",
      credits: 25,
      price: "$19.99",
      description: "For regular content creators",
      perCredit: "$0.80",
      popular: true,
    },
    {
      name: "Pro Pack",
      credits: 50,
      price: "$34.99",
      description: "Best value for active creators",
      perCredit: "$0.70",
      popular: false,
    },
    {
      name: "Power User",
      credits: 100,
      price: "$59.99",
      description: "For serious content production",
      perCredit: "$0.60",
      popular: false,
    },
    {
      name: "Ultimate Bundle",
      credits: 250,
      price: "$129.99",
      description: "Maximum value for teams",
      perCredit: "$0.52",
      popular: false,
    },
  ];

  const whatCreditsCanDo = [
    "Upload & process videos",
    "Create meetings & events",
    "Use AI Studio recording",
    "Generate AI clips",
    "AI post-production editing",
    "Create podcasts & episodes",
    "Use all platform features",
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary cursor-pointer" onClick={() => navigate("/")}>
            Seeksy
          </h2>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth?mode=login")}>
              Log In
            </Button>
            <Button onClick={() => navigate("/auth?mode=signup")}>
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple Credit-Based Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            1 credit = 1 activity. No subscriptions. Buy credits in bulk and use them as you need.
          </p>
          <div className="mt-6 inline-block bg-primary/10 border border-primary/20 rounded-lg px-6 py-3">
            <p className="text-sm font-semibold text-primary">🎁 New users get 5 free credits to start!</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto mb-12">
          {creditPackages.map((pkg) => (
            <Card
              key={pkg.name}
              className={`p-6 relative ${
                pkg.popular
                  ? "border-2 border-primary shadow-glow scale-105"
                  : "border border-border"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                  Best Value
                </div>
              )}
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                <div className="text-3xl font-bold text-primary mb-1">{pkg.credits}</div>
                <div className="text-xs text-muted-foreground mb-2">credits</div>
                <div className="text-2xl font-bold">{pkg.price}</div>
                <div className="text-xs text-muted-foreground">{pkg.perCredit} per credit</div>
              </div>
              <p className="text-sm text-muted-foreground text-center mb-4">{pkg.description}</p>
              <Button
                className="w-full"
                variant={pkg.popular ? "default" : "outline"}
                onClick={() => navigate("/auth?mode=signup")}
              >
                Buy Credits
              </Button>
            </Card>
          ))}
        </div>

        <Card className="p-8 mb-20 max-w-4xl mx-auto bg-gradient-to-br from-primary/5 to-background">
          <h3 className="text-2xl font-bold mb-4 text-center">What Can You Do With Credits?</h3>
          <p className="text-center text-muted-foreground mb-6">Every activity costs just 1 credit. Simple.</p>
          <div className="grid md:grid-cols-2 gap-3">
            {whatCreditsCanDo.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-primary/10 rounded-lg text-center">
            <p className="text-sm font-semibold text-primary">
              🎰 Bonus: Spend 20 credits and get a chance to spin the wheel for free credits!
            </p>
          </div>
        </Card>

        <section className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">How does credit-based pricing work?</h3>
              <p className="text-muted-foreground">
                Simple: 1 credit = 1 activity. Whether you're uploading a video, creating a meeting, 
                using AI editing, or any other feature—it's always 1 credit. No complex tiers or limits.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Do credits expire?</h3>
              <p className="text-muted-foreground">
                No! Your credits never expire. Buy a pack and use them whenever you're ready. 
                This gives you complete flexibility to create on your own schedule.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Can I try before I buy?</h3>
              <p className="text-muted-foreground">
                Absolutely! New users get 5 free credits to start. Test all our features and see 
                the value before purchasing additional credits.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">What's the spin wheel bonus?</h3>
              <p className="text-muted-foreground">
                After every 20 credits you spend, you get a free spin to win bonus credits! 
                Prizes range from 1-25 credits. It's our way of rewarding active creators.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Which package should I choose?</h3>
              <p className="text-muted-foreground">
                Start with the Starter Pack to test things out. Most active creators find the 
                Creator Pack or Pro Pack offers the best value per credit. Bulk buying saves you money!
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Can I buy more credits anytime?</h3>
              <p className="text-muted-foreground">
                Yes! Purchase credits whenever you need them. Your balance rolls over and you can 
                mix and match packages based on your current needs.
              </p>
            </Card>
          </div>
        </section>

        <section className="max-w-6xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-4">How We Compare</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            See how Seeksy stacks up against other podcast platforms
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-center p-4 font-semibold">
                    <div className="text-primary text-lg">Seeksy</div>
                  </th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">
                    Riverside
                  </th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">
                    Descript
                  </th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">Anchor</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="p-4">Free Studio Recording</td>
                  <td className="text-center p-4">
                    <Check className="h-5 w-5 text-primary mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <Check className="h-5 w-5 text-muted-foreground mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4">AI Filler Word Removal</td>
                  <td className="text-center p-4">
                    <Check className="h-5 w-5 text-primary mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <Check className="h-5 w-5 text-muted-foreground mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4">AI-Generated Clips</td>
                  <td className="text-center p-4">
                    <Check className="h-5 w-5 text-primary mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <Check className="h-5 w-5 text-muted-foreground mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4">Auto Chaptering</td>
                  <td className="text-center p-4">
                    <Check className="h-5 w-5 text-primary mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4">Creator Landing Page</td>
                  <td className="text-center p-4">
                    <Check className="h-5 w-5 text-primary mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4">Ad Monetization Platform</td>
                  <td className="text-center p-4">
                    <Check className="h-5 w-5 text-primary mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <Check className="h-5 w-5 text-muted-foreground mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4">Pricing Model</td>
                  <td className="text-center p-4 font-semibold text-primary">Credits (Pay as you go)</td>
                  <td className="text-center p-4 text-muted-foreground">Monthly subscription</td>
                  <td className="text-center p-4 text-muted-foreground">Monthly subscription</td>
                  <td className="text-center p-4 text-muted-foreground">Free (limited)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4">Starting Price</td>
                  <td className="text-center p-4 font-semibold text-primary">$9.99 (10 credits)</td>
                  <td className="text-center p-4 text-muted-foreground">$19/mo</td>
                  <td className="text-center p-4 text-muted-foreground">$24/mo</td>
                  <td className="text-center p-4 text-muted-foreground">Free</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="text-center max-w-2xl mx-auto">
          <Card className="p-12 bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-2 border-primary/20">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Creating?</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Join thousands of creators using Seeksy to produce professional-quality podcasts
            </p>
            <Button size="lg" onClick={() => navigate("/auth?mode=signup")}>
              Start Free Today
            </Button>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-muted-foreground mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
            <a href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <span className="hidden md:inline">•</span>
            <a href="/terms" className="hover:text-primary transition-colors">
              Terms & Conditions
            </a>
            <span className="hidden md:inline">•</span>
            <a href="/cookies" className="hover:text-primary transition-colors">
              Cookie Policy
            </a>
          </div>
          <p>© 2024 Seeksy. Connecting Your Way.</p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
