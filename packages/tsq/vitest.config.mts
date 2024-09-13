import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    poolOptions: {
      forks: {
        execArgv: ['--experimental-vm-modules']
      }
    },
    coverage: {
      include: ['src/**/*.mts'],
      enabled: true,
      reportOnFailure: true,
      provider: 'istanbul',
      reporter: ['html', 'json-summary']
    },
    reporters: ['junit', 'html'],
    outputFile: {
      junit: './test-reports/junit.xml',
      html: './test-reports/index.html'
    }
  },
})