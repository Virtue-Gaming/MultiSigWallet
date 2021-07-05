const AWS = require('aws-sdk'); // eslint-disable-line max-len, import/no-extraneous-dependencies
const base = require('./aws-base.js');
const Route53 = require('nice-route53');

function _removeDnsRecord(sls) {
    base.setUpAWS(sls);
    const cnameDomain = getDomainName(sls);
    deleteCnameDnsRecord(cnameDomain, sls);
}

function _addDnsRecord(sls) {
    base.setUpAWS(sls);
    const apiDistributionDomain = getApiDistributionDomain(sls);
    const cnameDomain = getDomainName(sls);

    if(apiDistributionDomain) {
        createCnameDnsRecord(cnameDomain, apiDistributionDomain, sls);
    }
}

async function deleteCnameDnsRecord(key, sls) {
    const args = {
        zoneId : await getHostedZoneId(key),
        name   : key,
        type   : 'CNAME',
    };
    const r53 = new Route53();
    r53.delRecord(args, function(err, res) {
        if (err && err.code === 'RecordNotFound') {
            sls.cli.log(`WARNING DNS record for [${key}] didn't exist. We cannot remove it`);
        } else if (err) {
            sls.cli.log(`ERROR removing the DNS record for [${key}]`);
            console.log(err);
        } else {
            sls.cli.log(`DNS record [${key}] removed`);
        }
    });
}

async function createCnameDnsRecord(key, value, sls) {
    const args = {
        zoneId: await getHostedZoneId(key),
        name: key,
        type: 'CNAME',
        ttl: 60,
        values: [value]
    };
    const r53 = new Route53();
    r53.upsertRecord(args, function(err, res) {
        if (err) {
            sls.cli.log(`ERROR creating the DNS record for [${key}:${value}]`);
            console.log(err);
        } else {
            sls.cli.log(`DNS record [${key}] created`);
        }
    });
}

function getDomainName(sls) {
    return sls.service.custom.fullstack.domain;
}

function getApiDistributionDomain(sls) {
    const awsInfo = sls.pluginManager.getPlugins().find((plugin) => {
        return plugin.constructor.name === 'AwsInfo';
    });

    if (!awsInfo || !awsInfo.gatheredData) {
        return;
    }

    const outputs = awsInfo.gatheredData.outputs;
    const apiDistributionDomain = outputs.find((output) => {
        return output.OutputKey === 'ApiDistribution';
    });

    if (!apiDistributionDomain || !apiDistributionDomain.OutputValue) {
        return;
    }

    return apiDistributionDomain.OutputValue;
}

async function getHostedZoneId(domainName) {
    domainName += (domainName.endsWith('.') ? '' : '.'); // eslint-disable-line max-len, no-param-reassign

    return new AWS.Route53().listHostedZones({})
        .promise()
        .then(zonesObj => zonesObj.HostedZones.find(it => domainName.endsWith(it.Name))
            .Id.match(/\/hostedzone\/(.*)/)[1]);
}

function configureThem(sls) {
    base.addHook(sls, 'after:deploy:deploy', _addDnsRecord);
    base.addHook(sls, 'before:remove:remove', _removeDnsRecord);
}

module.exports = {
    configureThem,
};

