const AWS = require('aws-sdk'); // eslint-disable-line max-len, import/no-extraneous-dependencies

function setUpAWS(sls) {
    const region = sls.getProvider('aws').getRegionSourceValue().value;
    const credentials = sls.getProvider('aws').getCredentials();

    AWS.config.region = region;
    AWS.config.credentials = credentials.credentials;
}

function getStage(sls) {
    // TODO Unlink the AWS hardcoded dependency
    return sls.getProvider('aws').getStageSourceValue().value;
}

function addHook(sls, trigger, callback) {
    const pluginName = `RuntimePlugin_${Math.floor((Math.random() * 1000) + 1)}`;
    const plugin = { constructor: { name: pluginName }, hooks: {} };
    plugin.hooks[trigger] = callback.bind(undefined, sls);
    sls.pluginManager.loadHooks(plugin);
}

module.exports = {
    getStage,
    setUpAWS,
    addHook,
};
