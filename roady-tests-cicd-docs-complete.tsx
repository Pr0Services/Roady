import React from 'react';
import { CheckCircle, TestTube, GitBranch, FileText, Shield, Zap, Code, Server, BookOpen, Terminal } from 'lucide-react';

export default function TestsCICDComplete() {
  const sections = [
    {
      title: 'Tests Unitaires',
      icon: TestTube,
      color: 'from-green-500 to-emerald-500',
      files: [
        { name: 'tests/test_photo_ai.py', tests: 15, desc: 'Photo AI Service & API' },
        { name: 'tests/test_sms.py', tests: 18, desc: 'Twilio SMS & Templates' },
        { name: 'tests/test_bim.py', tests: 16, desc: 'Forge BIM Service' },
        { name: 'tests/test_analytics.py', tests: 14, desc: 'Analytics & KPIs' },
        { name: 'pytest.ini', tests: null, desc: 'Configuration pytest' },
        { name: 'conftest.py', tests: null, desc: 'Fixtures & helpers' },
      ],
      stats: { total: 63, coverage: '70%+' }
    },
    {
      title: 'CI/CD Pipeline',
      icon: GitBranch,
      color: 'from-blue-500 to-cyan-500',
      files: [
        { name: '.github/workflows/ci.yml', desc: 'Pipeline principal (lint, test, build, deploy)' },
        { name: '.github/workflows/pr-check.yml', desc: 'Checks PR (validation, sécurité, preview)' },
      ],
      features: [
        'Lint & Format (Black, isort, Flake8, ESLint)',
        'Tests avec PostgreSQL & Redis',
        'Coverage Codecov (70% min)',
        'Security scan (Trivy, Snyk)',
        'Build Docker multi-arch',
        'Deploy Staging (develop)',
        'Deploy Production (main)',
        'Rollback automatique',
        'Notifications Slack'
      ]
    },
    {
      title: 'Documentation API',
      icon: BookOpen,
      color: 'from-purple-500 to-pink-500',
      files: [
        { name: 'docs/api_docs.py', desc: 'Config OpenAPI/Swagger' },
        { name: 'docs/API.md', desc: 'Documentation complète Markdown' },
      ],
      features: [
        'OpenAPI 3.0 spec',
        'Swagger UI personnalisé',
        'ReDoc alternative',
        'Exemples de requêtes',
        'Tous les endpoints documentés',
        'Codes erreur standardisés',
        'Rate limits documentés',
        'Webhooks documentés'
      ]
    }
  ];

  const testCategories = [
    { name: 'Unit Tests', count: 50, icon: '🧪' },
    { name: 'Integration Tests', count: 8, icon: '🔗' },
    { name: 'Performance Tests', count: 5, icon: '⚡' },
  ];

  const cicdStages = [
    { name: 'Lint', time: '~1min', icon: '🔍' },
    { name: 'Test Backend', time: '~3min', icon: '🧪' },
    { name: 'Test Frontend', time: '~2min', icon: '⚛️' },
    { name: 'Security', time: '~2min', icon: '🔒' },
    { name: 'Build', time: '~5min', icon: '📦' },
    { name: 'Deploy', time: '~3min', icon: '🚀' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-green-500 to-blue-500 mb-4">
            <CheckCircle size={40} />
          </div>
          <h1 className="text-4xl font-bold mb-2">Tests, CI/CD & Documentation</h1>
          <p className="text-slate-400 text-lg">Infrastructure complète pour ROADY</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
            <div className="text-3xl font-bold text-green-400">63</div>
            <div className="text-sm text-slate-400">Tests</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
            <div className="text-3xl font-bold text-blue-400">70%+</div>
            <div className="text-sm text-slate-400">Coverage</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
            <div className="text-3xl font-bold text-purple-400">6</div>
            <div className="text-sm text-slate-400">CI Stages</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
            <div className="text-3xl font-bold text-amber-400">25+</div>
            <div className="text-sm text-slate-400">API Endpoints</div>
          </div>
        </div>

        {/* Sections */}
        {sections.map((section, idx) => (
          <div key={idx} className="mb-8 bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
            <div className={`p-5 bg-gradient-to-r ${section.color}`}>
              <div className="flex items-center gap-3">
                <section.icon size={28} />
                <h2 className="text-xl font-bold">{section.title}</h2>
              </div>
            </div>
            
            <div className="p-5">
              {/* Files */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Fichiers créés</h3>
                <div className="space-y-2">
                  {section.files.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Code size={16} className="text-blue-400" />
                        <code className="text-sm text-slate-300">{file.name}</code>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-400">{file.desc}</span>
                        {file.tests && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                            {file.tests} tests
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              {section.features && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Fonctionnalités</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {section.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                        <span className="text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              {section.stats && (
                <div className="mt-4 flex gap-4">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                    {section.stats.total} tests
                  </span>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                    Coverage: {section.stats.coverage}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* CI/CD Pipeline Visual */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="text-blue-400" />
            Pipeline CI/CD
          </h3>
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {cicdStages.map((stage, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center min-w-[80px]">
                  <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-2xl mb-2">
                    {stage.icon}
                  </div>
                  <span className="text-sm font-medium">{stage.name}</span>
                  <span className="text-xs text-slate-500">{stage.time}</span>
                </div>
                {i < cicdStages.length - 1 && (
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-2 min-w-[20px]" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Commands */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 border border-slate-600">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Terminal className="text-green-400" />
            Commandes utiles
          </h3>
          <div className="grid md:grid-cols-2 gap-4 font-mono text-sm">
            <div className="p-3 bg-slate-900 rounded-lg">
              <span className="text-slate-500"># Lancer les tests</span>
              <br />
              <span className="text-green-400">pytest tests/ -v --cov</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg">
              <span className="text-slate-500"># Vérifier le formatage</span>
              <br />
              <span className="text-green-400">black --check backend/</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg">
              <span className="text-slate-500"># Voir la doc API</span>
              <br />
              <span className="text-green-400">open http://localhost:8000/docs</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg">
              <span className="text-slate-500"># Déployer staging</span>
              <br />
              <span className="text-green-400">git push origin develop</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-10 text-slate-500 text-sm">
          <p>ROADY Construction Management System • Infrastructure complète</p>
        </div>
      </div>
    </div>
  );
}
