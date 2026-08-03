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

      // 1. Downgrade fmt to C++17
      // 2. Inject FMT_USE_CONSTEVAL=0 into fmt and RCT-Folly
      // 3. Patch the fmt headers directly to respect our flag
      const patch = `
  # --- FMT CONSTEVAL FIX ---
  installer.pods_project.targets.each do |target|
    if target.name == 'fmt'
      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
      end
    end
    
    if target.name == 'fmt' || target.name == 'RCT-Folly'
      target.build_configurations.each do |config|
        cpp_flags = config.build_settings['OTHER_CPLUSPLUSFLAGS'] || ['$(inherited)']
        cpp_flags = [cpp_flags] unless cpp_flags.is_a?(Array)
        unless cpp_flags.include?('-DFMT_USE_CONSTEVAL=0')
          cpp_flags << '-DFMT_USE_CONSTEVAL=0'
        end
        config.build_settings['OTHER_CPLUSPLUSFLAGS'] = cpp_flags
      end
    end
  end

  ['base.h', 'core.h'].each do |header_file|
    fmt_header = File.join(installer.sandbox.root.to_s, 'fmt', 'include', 'fmt', header_file)
    if File.exist?(fmt_header)
      fmt_contents = File.read(fmt_header)
      old_check = "#if !defined(__cpp_lib_is_constant_evaluated)\\n"
      new_check = "#ifdef FMT_USE_CONSTEVAL\\n// Use the provided definition.\\n#elif !defined(__cpp_lib_is_constant_evaluated)\\n"
      if fmt_contents.include?(old_check)
        File.write(fmt_header, fmt_contents.sub(old_check, new_check))
      end
    end
  end
  # -------------------------
`;

      if (!contents.includes("FMT_USE_CONSTEVAL=0")) {
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