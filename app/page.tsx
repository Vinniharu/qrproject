import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Users, FileText, Clock, CheckCircle, Smartphone, Zap, Shield, Database } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-purple-800/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.1),transparent_50%)]"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/50 backdrop-blur-xl border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="relative">
                <QrCode className="h-8 w-8 text-purple-400 mr-2" />
                <div className="absolute inset-0 h-8 w-8 text-purple-400 mr-2 animate-ping opacity-20">
                  <QrCode className="h-8 w-8" />
                </div>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">
                QR Attendance
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg shadow-purple-500/25">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="text-center relative z-10">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-violet-300 bg-clip-text text-transparent animate-float">
                QR Attendance Platform
              </h1>
              <p className="text-xl md:text-2xl text-purple-200 mb-8 max-w-3xl mx-auto leading-relaxed">
                Next-generation attendance tracking with advanced QR technology and real-time analytics
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="cyber-button bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white border-purple-400/50 shadow-lg shadow-purple-500/25 text-lg px-8 py-4">
                  <Zap className="mr-2 h-5 w-5" />
                  Launch Platform
                </Button>
                <Button size="lg" variant="outline" className="cyber-button border-purple-400/50 text-purple-300 hover:text-purple-200 hover:border-purple-300/70 text-lg px-8 py-4">
                  <Shield className="mr-2 h-5 w-5" />
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Advanced Features
            </h2>
            <p className="text-purple-300 text-lg max-w-2xl mx-auto">
              Cutting-edge technology stack for modern attendance management
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group">
              <Card className="cyber-glass border-purple-500/20 hover:border-purple-400/40 transition-all duration-500 h-full hover:shadow-2xl hover:shadow-purple-500/20">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center mb-4 group-hover:animate-pulse">
                    <QrCode className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-white group-hover:neon-text transition-all duration-300">Smart QR Generation</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-purple-300">
                    Dynamic QR code generation with real-time session management and secure attendance tracking
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
            
            <div className="group">
              <Card className="cyber-glass border-purple-500/20 hover:border-purple-400/40 transition-all duration-500 h-full hover:shadow-2xl hover:shadow-purple-500/20">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 group-hover:animate-pulse">
                    <Database className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-white group-hover:neon-text transition-all duration-300">Real-time Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-purple-300">
                    Advanced analytics dashboard with comprehensive reporting and attendance insights
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
            
            <div className="group">
              <Card className="cyber-glass border-purple-500/20 hover:border-purple-400/40 transition-all duration-500 h-full hover:shadow-2xl hover:shadow-purple-500/20">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4 group-hover:animate-pulse">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-white group-hover:neon-text transition-all duration-300">Secure Authentication</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-purple-300">
                    Multi-layer security with encrypted data transmission and secure user authentication
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-purple-300 text-lg max-w-2xl mx-auto">
              Simple three-step process for modern attendance tracking
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:neon-text transition-all duration-300">Create Session</h3>
              <p className="text-purple-300">
                Set up your attendance session with course details and time parameters
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:neon-text transition-all duration-300">Generate QR Code</h3>
              <p className="text-purple-300">
                Generate unique QR codes for each session with real-time validation
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:neon-text transition-all duration-300">Track Attendance</h3>
              <p className="text-purple-300">
                Students scan QR codes and attendance is automatically recorded and analyzed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Ready to Transform Your Attendance System?
            </h2>
            <p className="text-xl text-purple-300 mb-8 max-w-2xl mx-auto">
              Join the future of attendance tracking with our advanced QR platform
            </p>
            <Button size="lg" className="cyber-button bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white border-purple-400/50 shadow-lg shadow-purple-500/25 text-lg px-8 py-4">
              <Zap className="mr-2 h-5 w-5" />
              Get Started Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black/80 backdrop-blur-xl border-t border-purple-500/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <QrCode className="h-8 w-8 text-purple-400 mr-2" />
                <div className="absolute inset-0 h-8 w-8 text-purple-400 mr-2 animate-ping opacity-20">
                  <QrCode className="h-8 w-8" />
                </div>
              </div>
              <h4 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">
                QR Attendance
              </h4>
            </div>
            <p className="text-gray-400 mb-6">
              Next-generation quantum-powered attendance management system
            </p>
            <div className="flex justify-center space-x-8 mb-8">
              <Link href="/login" className="text-gray-400 hover:text-purple-300 transition-colors">
                Access Portal
              </Link>
              <Link href="/register" className="text-gray-400 hover:text-purple-300 transition-colors">
                Initialize Account
              </Link>
            </div>
            <div className="pt-8 border-t border-purple-500/20 text-center text-gray-500">
              <p>&copy; 2024 QR Attendance Neural Systems. All quantum rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
