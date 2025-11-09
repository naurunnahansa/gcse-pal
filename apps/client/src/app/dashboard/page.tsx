export default async function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Hero Section */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Answerpoint
          </h1>
          <p className="text-gray-600 mt-2">
            Your AI-powered customer service platform
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Getting Started Cards */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Getting Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
                  <span className="text-lg font-bold text-blue-600">1</span>
                </div>
                <h3 className="font-semibold text-gray-900">
                  Set Up Knowledge Base
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                Upload your company documents and knowledge base to power your AI agents
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100">
                  <span className="text-lg font-bold text-purple-600">2</span>
                </div>
                <h3 className="font-semibold text-gray-900">
                  Configure Agents
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                Customize your AI agents for different use cases and customer interactions
              </p>
            </div>
          </div>
        </div>

        {/* Quick Overview Cards */}
        <div className="border border-gray-200 rounded-lg p-6 bg-white">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Platform Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-sm text-gray-600">Active Agents</span>
              <span className="text-2xl font-bold text-gray-900">0</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-sm text-gray-600">Knowledge Items</span>
              <span className="text-2xl font-bold text-gray-900">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">API Usage</span>
              <span className="text-2xl font-bold text-gray-900">0%</span>
            </div>
          </div>
        </div>

        {/* Quick Links Card */}
        <div className="border border-gray-200 rounded-lg p-6 bg-white">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Links
          </h3>
          <div className="space-y-2">
            <a
              href="/dashboard/agents"
              className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              → Manage Agents
            </a>
            <a
              href="/dashboard/knowledge-base"
              className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              → Upload Knowledge Base
            </a>
            <a
              href="/dashboard/settings"
              className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              → Organization Settings
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
