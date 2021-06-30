const dns = require('./aws-dns.js');

module.exports = async function (sls) { // eslint-disable-line max-len, func-names
    const result = {};

    configureSlsVariables(sls, result);
    configureHooks(sls);

    return result;
}

function configureSlsVariables(sls, variables) {
    Object.getOwnPropertyNames(variables).forEach((propertyName) => {
    // First, we are doing the properties not enumerable, to avoid its population by Serverless
    // Following acces to this object makes by Serverless are done directly using the keys, so there won't be any problems
        Object.defineProperty(variables, propertyName, { enumerable: false });
    });

    // Then, we set one property in the object to allow Serverless to know that something is defined
    variables.I_MAKE_THE_OBJECT_TRUE = true; // eslint-disable-line max-len, no-param-reassign
}

let hooksConfigured = false;
function configureHooks(sls) {
    hooksConfigured = hooksConfigured || new Promise((resolve, reject) => {
        dns.configureThem(sls);
        resolve();
    })
}