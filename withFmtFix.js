const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withFmtFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfile = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');

      const fixSnippet = `
  installer.pods_project.targets.each do |target|
    if target.name == 'fmt'
      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
      end
    end
  end
`;
      // Inject the fix into the post_install block if it isn't already there
      if (!contents.includes("target.name == 'fmt'")) {
        contents = contents.replace(/post_install do \|installer\|/g, `post_install do |installer|\n${fixSnippet}`);
        fs.writeFileSync(podfile, contents);
      }
      return config;
    },
  ]);
};