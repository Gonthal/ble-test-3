const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withFmtFix = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const file = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      if (!fs.existsSync(file)) {
        return config;
      }

      let contents = fs.readFileSync(file, 'utf8');

      const patch = `
  installer.pods_project.targets.each do |target|
    if target.name == 'fmt' || target.name == 'RCT-Folly'
      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FMT_USE_CONSTEVAL=0'
      end
    end
  end
`;

      if (!contents.includes("target.name == 'fmt'")) {
        contents = contents.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|\n${patch}`
        );
        fs.writeFileSync(file, contents);
      }
      return config;
    },
  ]);
};

module.exports = withFmtFix;