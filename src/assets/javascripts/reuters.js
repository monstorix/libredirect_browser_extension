window.browser = window.browser || window.chrome;

import utils from './utils.js'

const targets = [
    /^https?:\/{2}(www\.|)reuters\.com.*/
];

let redirects = {}

const frontends = new Array("neuters")
const protocols = new Array("normal", "tor", "i2p", "loki")

for (let i = 0; i < frontends.length; i++) {
    redirects[frontends[i]] = {}
    for (let x = 0; x < protocols.length; x++) {
        redirects[frontends[i]][protocols[x]] = []
    }
}

let
    disableReuters,
    protocol,
    protocolFallback,
    reutersRedirects,
    neutersNormalRedirectsChecks,
    neutersNormalCustomRedirects,
    neutersTorRedirectsChecks,
    neutersTorCustomRedirects;

function init() {
    return new Promise(async resolve => {
        browser.storage.local.get(
            [
                "disableReuters",
                "protocol",
                "protocolFallback",
                "reutersRedirects",
                "neutersNormalRedirectsChecks",
                "neutersNormalCustomRedirects",
                "neutersTorRedirectsChecks",
                "neutersTorCustomRedirects",
            ],
            r => {
                disableReuters = r.disableReuters;
                protocol = r.protocol;
                protocolFallback = r.protocolFallback;
                reutersRedirects = r.reutersRedirects;
                neutersNormalRedirectsChecks = r.neutersNormalRedirectsChecks;
                neutersNormalCustomRedirects = r.neutersNormalCustomRedirects;
                neutersTorRedirectsChecks = r.neutersTorRedirectsChecks;
                neutersTorCustomRedirects = r.neutersTorCustomRedirects;
                resolve();
            }
        )
    })
}

init();
browser.storage.onChanged.addListener(init)

function redirect(url, type, initiator, disableOverride) {
    if (disableReuters && !disableOverride) return;
    if (type != "main_frame") return;
    const all = [
        ...reutersRedirects.neuters.normal,
        ...neutersNormalCustomRedirects
    ];
    if (initiator && (all.includes(initiator.origin) || targets.includes(initiator.host))) return;
    if (!targets.some(rx => rx.test(url.href))) return;

    let instancesList = [];
    if (protocol == 'tor') instancesList = [...neutersTorRedirectsChecks, ...neutersTorCustomRedirects];
    if ((instancesList.length === 0 && protocolFallback) || protocol == 'normal') {
        instancesList = [...neutersNormalRedirectsChecks, ...neutersNormalCustomRedirects];
    }
    if (instancesList.length === 0) return;

    const randomInstance = utils.getRandomInstance(instancesList);
    // stolen from https://addons.mozilla.org/en-US/firefox/addon/reuters-redirect/
    if (
        url.pathname.startsWith('/article/') ||
        url.pathname.startsWith('/pf/') ||
        url.pathname.startsWith('/arc/') ||
        url.pathname.startsWith('/resizer/')
    )
        return null;
    else if (url.pathname.endsWith('/'))
        return `${randomInstance}${url.pathname}`;
    else
        return `${randomInstance}${url.pathname}/`;
}

function initDefaults() {
    return new Promise(resolve => {
        browser.storage.local.set({
            disableReuters: true,

            reutersRedirects: redirects,

            neutersNormalRedirectsChecks: [...redirects.neuters.normal],
            neutersNormalCustomRedirects: [],

            neutersTorRedirectsChecks: [...redirects.neuters.tor],
            neutersTorCustomRedirects: [],
        }, () => resolve());
    });
}

export default {
    redirect,
    initDefaults
};
