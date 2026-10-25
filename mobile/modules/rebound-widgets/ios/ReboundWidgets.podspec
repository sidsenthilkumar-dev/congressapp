Pod::Spec.new do |s|
  s.name = 'ReboundWidgets'
  s.version = '1.0.0'
  s.summary = 'Opt-in Rebound session count widget bridge'
  s.description = s.summary
  s.license = { :type => 'MIT' }
  s.author = 'Rebound'
  s.homepage = 'https://github.com/sidsenthilkumar-dev/congressapp'
  s.platforms = { :ios => '16.0' }
  s.source = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.swift_version = '5.9'
  s.source_files = '**/*.swift'
end
