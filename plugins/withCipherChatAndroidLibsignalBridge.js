const {
  AndroidConfig,
  createRunOncePlugin,
  withAppBuildGradle,
  withDangerousMod,
  withMainApplication,
} = require('@expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

const pluginName = 'withCipherChatAndroidLibsignalBridge';
const pluginVersion = '1.0.0';
const androidPackage = 'com.amgadalzomi.cipherchat';
const bridgePackage = `${androidPackage}.signal`;
const libsignalVersion = '0.86.5';

function ensureLine(contents, line, marker) {
  if (contents.includes(marker ?? line)) {
    return contents;
  }

  return `${contents.trimEnd()}\n${line}\n`;
}

function createBridgeModuleSource() {
  return `package ${bridgePackage};

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

public final class CipherChatSignalBridgeModule extends ReactContextBaseJavaModule {
  public static final String NAME = "CipherChatSignalBridge";
  private static final String LIBSIGNAL_VERSION = "${libsignalVersion}";

  public CipherChatSignalBridgeModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void getReadiness(Promise promise) {
    WritableMap readiness = Arguments.createMap();
    WritableArray missing = Arguments.createArray();

    missing.pushString("X3DH session setup");
    missing.pushString("Double Ratchet encrypt/decrypt");
    missing.pushString("Encrypted Signal session storage");
    missing.pushString("Safety-number verification");
    missing.pushString("Key-change warnings");
    missing.pushString("Android runtime evidence");
    missing.pushString("External security review");

    readiness.putBoolean("adapterInstalled", true);
    readiness.putString("platform", "android");
    readiness.putString("libraryTarget", "official libsignal Android artifact");
    readiness.putString("androidPackage", "org.signal:libsignal-android");
    readiness.putString("companionPackage", "org.signal:libsignal-client");
    readiness.putString("officialLibsignalVersion", LIBSIGNAL_VERSION);
    readiness.putBoolean("productionReady", false);
    readiness.putArray("missingRequirements", missing);

    promise.resolve(readiness);
  }

  @ReactMethod
  public void encryptOneToOne(String ignoredPayload, Promise promise) {
    promise.reject(
      "CIPHERCHAT_SIGNAL_NOT_IMPLEMENTED",
      "Android libsignal bridge skeleton does not implement encryption. Production sends remain blocked."
    );
  }

  @ReactMethod
  public void decryptOneToOne(String ignoredPayload, Promise promise) {
    promise.reject(
      "CIPHERCHAT_SIGNAL_NOT_IMPLEMENTED",
      "Android libsignal bridge skeleton does not implement decryption. Production receives remain blocked."
    );
  }
}
`;
}

function createBridgePackageSource() {
  return `package ${bridgePackage};

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.Collections;
import java.util.List;

public final class CipherChatSignalBridgePackage implements ReactPackage {
  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    return Collections.singletonList(new CipherChatSignalBridgeModule(reactContext));
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }
}
`;
}

function addLibsignalGradleConfig(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') {
      throw new Error('CipherChat Android libsignal bridge plugin expects Groovy app/build.gradle.');
    }

    let contents = mod.modResults.contents;

    contents = ensureLine(
      contents,
      `
repositories {
    maven { url "https://build-artifacts.signal.org/libraries/maven/" }
}
`,
      'build-artifacts.signal.org/libraries/maven',
    );

    if (!contents.includes('org.signal:libsignal-android')) {
      contents = contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    implementation "org.signal:libsignal-android:${libsignalVersion}"\n    implementation "org.signal:libsignal-client:${libsignalVersion}"`,
      );
    }

    if (!contents.includes('libsignal_jni*.dylib')) {
      contents = contents.replace(
        /android\s*\{/,
        `android {\n    packagingOptions {\n        resources {\n            excludes += ["libsignal_jni*.dylib", "signal_jni*.dll", "libsignal_jni_testing.so"]\n        }\n    }`,
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });
}

function addNativePackageRegistration(config) {
  return withMainApplication(config, (mod) => {
    let contents = mod.modResults.contents;
    const importLine = `import ${bridgePackage}.CipherChatSignalBridgePackage`;

    if (!contents.includes(importLine)) {
      contents = contents.replace(/^package .*$/m, (packageLine) => `${packageLine}\n\n${importLine}`);
    }

    if (!contents.includes('CipherChatSignalBridgePackage()')) {
      contents = contents.replace(
        /PackageList\(this\)\.packages\.apply\s*\{/,
        `PackageList(this).packages.apply {\n            add(CipherChatSignalBridgePackage())`,
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });
}

function writeAndroidBridgeSources(config) {
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const sourceRoot = path.join(
        mod.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        ...bridgePackage.split('.'),
      );

      fs.mkdirSync(sourceRoot, { recursive: true });
      fs.writeFileSync(path.join(sourceRoot, 'CipherChatSignalBridgeModule.java'), createBridgeModuleSource());
      fs.writeFileSync(path.join(sourceRoot, 'CipherChatSignalBridgePackage.java'), createBridgePackageSource());

      return mod;
    },
  ]);
}

function withCipherChatAndroidLibsignalBridge(config) {
  config = AndroidConfig.Permissions.withPermissions(config, []);
  config = writeAndroidBridgeSources(config);
  config = addNativePackageRegistration(config);
  config = addLibsignalGradleConfig(config);
  return config;
}

module.exports = createRunOncePlugin(
  withCipherChatAndroidLibsignalBridge,
  pluginName,
  pluginVersion,
);
module.exports.libsignalVersion = libsignalVersion;
