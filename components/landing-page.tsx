import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import SEOStructuredData from "@/components/seo-structured-data"
import { 
  Target, 
  FileText, 
  LightbulbIcon, 
  Brain, 
  BarChart3, 
  Users, 
  Zap, 
  Award,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle,
  Smartphone,
  Download,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  ExternalLink
} from "lucide-react"

export default function LandingPage() {
  return (
    <>
      <SEOStructuredData type="landing" />
      <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary p-2">
                <Target className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">EDT</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container py-12 md:py-24 lg:py-32">
            <div className="mx-auto flex max-w-[64rem] flex-col items-center gap-6 text-center">
              <div className="space-y-4">
                <Badge variant="outline" className="px-3 py-1">
                  🚀 Accelerate Your Engineering Career
                </Badge>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                  Track Your <span className="text-primary">Technical Growth</span> & Career Progress
                </h1>
                <p className="mx-auto max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                  Accelerate your engineering career with comprehensive project tracking, goal management, and professional development analytics. Join thousands of engineers advancing their careers with EDT.
                </p>
              </div>
              <Badge variant="outline" className="mb-4">
                <Smartphone className="mr-2 h-3 w-3" />
                Now Available as PWA - Install on Your Device!
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
                Engineering Development
                <span className="text-primary"> Tracker</span>
              </h1>
              <p className="max-w-[42rem] text-lg text-muted-foreground sm:text-xl">
                The complete platform for tracking your engineering development journey. Set SMART goals, 
                document technical solutions, manage improvement projects, and get AI-powered insights.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="h-12 px-8">
                    <Download className="mr-2 h-5 w-5" />
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="h-12 px-8">
                    Sign In
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>No setup required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Works offline</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>AI-powered insights</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="container py-12 md:py-24 lg:py-32">
          <div className="mx-auto max-w-[64rem] text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Everything You Need for Professional Growth
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Built specifically for engineers in manufacturing, utilities, automation, and energy sectors
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Development Goals */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="rounded-full bg-blue-100 p-3 w-fit dark:bg-blue-900/20">
                  <Target className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle className="text-xl">SMART Development Goals</CardTitle>
                <CardDescription>
                  Set, track, and achieve professional development goals with built-in SMART criteria validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Progress tracking with deadlines
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Category-based organization
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    AI-powered goal suggestions
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Technical Logs */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="rounded-full bg-emerald-100 p-3 w-fit dark:bg-emerald-900/20">
                  <FileText className="h-6 w-6 text-emerald-500" />
                </div>
                <CardTitle className="text-xl">Technical Problem-Solving Logs</CardTitle>
                <CardDescription>
                  Document technical issues, solutions, and lessons learned for future reference
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    System-specific categorization
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Searchable solution database
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    File attachments & media
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Improvement Projects */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="rounded-full bg-amber-100 p-3 w-fit dark:bg-amber-900/20">
                  <LightbulbIcon className="h-6 w-6 text-amber-500" />
                </div>
                <CardTitle className="text-xl">Improvement Projects</CardTitle>
                <CardDescription>
                  Manage Kaizen-style initiatives, contractor projects, and continuous improvement efforts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Project timeline management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Budget tracking & ROI analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Milestone & task management
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="rounded-full bg-purple-100 p-3 w-fit dark:bg-purple-900/20">
                  <Brain className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle className="text-xl">AI-Powered Insights</CardTitle>
                <CardDescription>
                  Get personalized recommendations and pattern analysis powered by Google Gemini AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Automated skills analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Development suggestions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Trend predictions & patterns
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Analytics Dashboard */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="rounded-full bg-indigo-100 p-3 w-fit dark:bg-indigo-900/20">
                  <BarChart3 className="h-6 w-6 text-indigo-500" />
                </div>
                <CardTitle className="text-xl">Advanced Analytics</CardTitle>
                <CardDescription>
                  Comprehensive dashboards with charts, progress tracking, and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Goal completion rates
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Activity trends over time
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    System performance insights
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Reports & Export */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="rounded-full bg-orange-100 p-3 w-fit dark:bg-orange-900/20">
                  <Award className="h-6 w-6 text-orange-500" />
                </div>
                <CardTitle className="text-xl">Professional Reports</CardTitle>
                <CardDescription>
                  Generate detailed PDF reports for performance reviews, skills assessments, and documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Customizable date ranges
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Skills analysis reports
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Export to PDF/Excel
                  </li>
                </ul>
              </CardContent>
            </Card>          </div>
        </section>

        {/* AI Copilot Demo */}
        <section className="bg-gradient-to-br from-primary/5 via-background to-purple/5 py-12 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-[64rem] text-center mb-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/20">
                  <MessageCircle className="h-6 w-6 text-purple-500" />
                </div>
                <Badge variant="outline" className="px-3 py-1">
                  ✨ Try It Now
                </Badge>
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Experience AI-Powered Engineering Assistance
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Try our AI Copilot demo below. Ask engineering questions, get insights, or explore how AI can accelerate your development process.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign up to unlock personalized insights from your own projects, goals, and technical logs!
              </p>
            </div>            <div className="mx-auto max-w-4xl">
              <Card className="border-2 border-primary/20 shadow-xl">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* AI Copilot Feature Preview */}
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="rounded-full bg-purple-100 p-4 dark:bg-purple-900/20">
                          <MessageCircle className="h-8 w-8 text-purple-500" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-2xl font-bold">AI Engineering Copilot</h3>
                          <p className="text-muted-foreground">Your intelligent engineering assistant</p>
                        </div>
                      </div>
                    </div>

                    {/* Mock Chat Interface */}
                    <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-[80%] shadow-sm border">
                          <p className="text-sm">Hi! I'm your AI Engineering Copilot. I can help you understand your engineering data, provide insights on your projects, and answer questions about your goals and technical logs. What would you like to know?</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <div className="bg-primary text-primary-foreground rounded-lg p-4 max-w-[80%] shadow-sm">
                          <p className="text-sm">Analyze my recent project performance and suggest improvements</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-[80%] shadow-sm border">
                          <p className="text-sm">Based on your recent projects, I've identified several optimization opportunities:</p>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>Focus on automation in Project Alpha (20% efficiency gain)</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Implement preventive maintenance scheduling</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span>Skills gap analysis suggests PLC programming training</span>
                            </div>
                          </div>
                          <div className="mt-3 pt-2 border-t text-xs text-muted-foreground">
                            Referenced: 3 projects, 12 technical logs, 5 goals
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Feature Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <Brain className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                        <h4 className="font-semibold text-sm">Smart Analysis</h4>
                        <p className="text-xs text-muted-foreground mt-1">AI-powered insights from your engineering data</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                        <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
                        <h4 className="font-semibold text-sm">Goal Tracking</h4>
                        <p className="text-xs text-muted-foreground mt-1">Personalized recommendations for your development</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                        <FileText className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                        <h4 className="font-semibold text-sm">Technical Solutions</h4>
                        <p className="text-xs text-muted-foreground mt-1">Learn from your problem-solving history</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-8 text-center">
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>No registration required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Powered by Google Gemini AI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Engineering-focused responses</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link href="/register">
                    <Button size="lg" className="h-12 px-8">
                      <Brain className="mr-2 h-5 w-5" />
                      Unlock Full AI Power
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg" className="h-12 px-8">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Progressive Web App Features */}
        <section className="bg-secondary/20 py-12 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-[64rem] text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Modern PWA Experience
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Install on any device and work seamlessly online or offline
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div className="rounded-full bg-primary/10 p-4 w-fit mx-auto mb-4">
                  <Smartphone className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Install Anywhere</h3>
                <p className="text-sm text-muted-foreground">
                  Install directly to your home screen on mobile, tablet, or desktop
                </p>
              </div>

              <div className="text-center">
                <div className="rounded-full bg-primary/10 p-4 w-fit mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Offline Ready</h3>
                <p className="text-sm text-muted-foreground">
                  Continue working even without internet connection
                </p>
              </div>

              <div className="text-center">
                <div className="rounded-full bg-primary/10 p-4 w-fit mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Auto Updates</h3>
                <p className="text-sm text-muted-foreground">
                  Always stay up-to-date with automatic background updates
                </p>
              </div>

              <div className="text-center">
                <div className="rounded-full bg-primary/10 p-4 w-fit mx-auto mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Quick Access</h3>
                <p className="text-sm text-muted-foreground">
                  Launch instantly from your device's home screen or start menu
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Advanced Features */}
        <section className="container py-12 md:py-24">
          <div className="mx-auto max-w-[64rem]">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Built for Engineering Excellence
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Advanced features designed specifically for technical professionals
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="rounded-lg bg-blue-100 p-2 w-fit h-fit dark:bg-blue-900/20">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Team Collaboration</h3>
                    <p className="text-muted-foreground">
                      Assign team members to projects, share progress updates, and collaborate on improvement initiatives
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="rounded-lg bg-green-100 p-2 w-fit h-fit dark:bg-green-900/20">
                    <Zap className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">System Integrations</h3>
                    <p className="text-muted-foreground">
                      Connect with SCADA, CMMS, PLC systems, and other industrial software platforms
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="rounded-lg bg-purple-100 p-2 w-fit h-fit dark:bg-purple-900/20">
                    <Brain className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">AI Project Proposals</h3>
                    <p className="text-muted-foreground">
                      Generate detailed project proposals and timelines using AI-powered assistance
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="rounded-lg bg-amber-100 p-2 w-fit h-fit dark:bg-amber-900/20">
                    <Award className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Skills Assessment</h3>
                    <p className="text-muted-foreground">
                      Automated skills analysis based on your activities with personalized development recommendations
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="rounded-lg bg-indigo-100 p-2 w-fit h-fit dark:bg-indigo-900/20">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Performance Metrics</h3>
                    <p className="text-muted-foreground">
                      Track ROI, completion rates, and efficiency improvements with detailed analytics
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="rounded-lg bg-red-100 p-2 w-fit h-fit dark:bg-red-900/20">
                    <TrendingUp className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Predictive Insights</h3>
                    <p className="text-muted-foreground">
                      AI-powered predictions for project success, risk assessment, and development trends
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary/5 py-12 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-[64rem] text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Ready to Accelerate Your Development?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Join engineers who are already tracking their growth and achieving their goals
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="h-12 px-8">
                    <Download className="mr-2 h-5 w-5" />
                    Start Your Journey
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="h-12 px-8">
                    Sign In
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Free trial • No credit card required • Install as PWA
              </p>
            </div>
          </div>
        </section>
      </main>      <footer className="border-t bg-background/80">
        {/* Contact Section */}
        <div className="container py-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary p-1.5">
                  <Target className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-medium">Engineering Development Tracker</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Built for engineering excellence. Helping technical professionals track their growth, 
                manage projects, and accelerate their careers through data-driven insights.
              </p>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Need Custom Engineering Solutions?</h3>
              <p className="text-sm text-muted-foreground">
                Looking for custom engineering projects, automation solutions, software development, or technical consulting? 
                Let's discuss how we can help bring your ideas to life.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                    <Mail className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <a 
                      href="mailto:support@techrehub.co.zw" 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      support@techrehub.co.zw
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
                    <Phone className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Phone</p>
                    <a 
                      href="tel:+1234567890" 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      +263 719447 131
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/20">
                    <MapPin className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-muted-foreground">
                      Serving clients everywhere - based in Harare, Zimbabwe
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Engineering Services</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Industrial Automation & Control Systems</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>PLC Programming & SCADA Development</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Process Optimization & Lean Manufacturing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Custom Engineering Software Solutions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Technical Consulting & Project Management</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Hardware Design,Prototyping & Repair</span>
                </li>
              </ul>
              <div className="pt-4">
                <a 
                  href="mailto:support@techrehub.co.zw?subject=Custom Engineering Project Inquiry"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                >
                  <Mail className="h-4 w-4" />
                  Get a Project Quote
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t py-6">
          <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} EDT. Built for engineering excellence.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Ready to start your project?</span>
              <a 
                href="mailto:support@techrehub.co.zw"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Contact us today
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}
