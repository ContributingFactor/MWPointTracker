let list = document.querySelector('div.pageContent.MuiBox-root.portal-css-0');
let trackedUploads = [];
// Start undefined to force a read of the options.
let showProgressBar = undefined;

function readOptionsFromStorage() {
    chrome.storage.sync.get({ showProgressBar: true },
        (items) => {
            if (items.showProgressBar){
                showProgressBar = items.showProgressBar;
            }
        }
    );
}

function readOptionsAndCountDownloads() {
    chrome.storage.sync.get({ showProgressBar: true },
        (items) => {
            showProgressBar = items.showProgressBar;
            countDownloads();
        }
    );
}

const observer = new MutationObserver(() => {
    // if we find the nprogress div, it means the content is changing
    // and we need to clear our tracked downloads cache.
    if (document.querySelector('div#nprogress')) {
        trackedUploads = [];
        readOptionsFromStorage();
        return;
    }
    list = document.querySelector('div.pageContent.MuiBox-root.portal-css-0');
    if (list) {
        if (showProgressBar === undefined){
            readOptionsAndCountDownloads();
        } else{
            countDownloads();
        }
    }
});

const target = document.querySelector('body');
const config = { childList: true };
observer.observe(target, config);

// Run the script at least once.
readOptionsAndCountDownloads();

// Run it again whenever the user scrolls.
document.addEventListener('scroll', countDownloads);


// Numbers over 1000 are shown on the site using the kilo
// abbreviation. For example 1400 would appear as `1.4 k` 
// This function converts a string to a number type, if 
// necessary by convertint from the kilo format.
// Needs to support N.n k as well as N k
function strToNumber(inVal) {
    const groups = /(\d+)\.?(\d+)?\sk/.exec(inVal);
    if (groups && groups[1]) {
        let val = Number(groups[1] * 1000);
        if (groups[2]) {
            val += Number(groups[2] * 100);
        }
        return val;
    }
    return Number(inVal);
}

// Return the siblings of an element
function getSiblings(elem) {
    return Array.from(elem.parentNode.childNodes).filter((s) => s !== elem);
}

function getRewardInterval(total) {
    next = 100;
    if (total <= 50) {
        next = 10;
    } else if (total <= 500) {
        next = 25;
    } else if (total <= 1000) {
        next = 50;
    }
    return next;
}

// Map the total to MakerWorld's point system.
// If we are 1 dowload away from the next points award
// make the text red. If we are 2 points away, make the
// text orange.
function getTotalValueColor(total) {
    let textColor = '';
    mod = getRewardInterval(total);
    if (total > 0) {
        if (total % mod >= mod - 1) {
            textColor = 'red';
        } else if (total % mod >= mod - 2) {
            textColor = 'orange';
        }
    }
    return textColor;
}

function nextRewardPoints(total) {
    const interval = getRewardInterval(total);
    const mod = total % interval;
    if (total === 0 || mod === 0) {
        return total + interval;
    }
    const rv = total + (interval - mod);
    return rv;
}

function countDownloads() {
    const items = list.querySelectorAll("[data-trackid$='_from_uploads']");
    for (item of items) {
        if (!item) {
            continue;
        }
        if (trackedUploads.includes(item.dataset.trackid)) {
            continue;
        }
        trackedUploads.push(item.dataset.trackid);
        // The div we care about include a 'div.download_count'
        // IMPORTANT: The download_count div actually marks the number of prints
        const printsDiv = item.querySelector("div.download_count");
        // Get the downloads div as the sibling of the prints div
        const sibs = getSiblings(printsDiv);
        if (!sibs || sibs.length > 1) continue;
        const downloadsDiv = sibs[0];

        // Find the <span> value for each
        const printsStr = printsDiv.querySelector("span").textContent;
        const downloadsStr = downloadsDiv.querySelector("span").textContent;
        if (!printsStr || !downloadsStr) {
            continue;
        }
        const numPrints = strToNumber(printsStr);
        const numDownloads = strToNumber(downloadsStr);
        const total = numDownloads + numPrints * 2;

        let textColor = getTotalValueColor(total);
        // Insert our value next to the number of downloads.
        const badgeDiv = document.createElement("div");
        badgeDiv.classList.add('mwcounter', 'portal-css-5h23f0');
        const badge = document.createElement("span");
        if (textColor) {
            badge.style.cssText = `color:${textColor}`;
        }
        badge.textContent = `P ${total}`
        printsDiv.insertAdjacentElement("afterend", badgeDiv);
        badgeDiv.insertAdjacentElement("beforeend", badge);

        // Add a progress bar that shows distance to next reward.
        // On mouse-over the tooltip will show:
        // current prints / next reward
        console.log(`showProgressBar ${showProgressBar}`);
        if (showProgressBar) {
            const elem = item.querySelector('div.portal-css-1kap1iw');
            if (elem) {
                const prog = document.createElement('progress');
                prog.value = `${total % getRewardInterval(total)}`;
                prog.max = `${getRewardInterval(total)}`;
                prog.style.accentColor = 'limeGreen';
                prog.style.width = '100%';
                prog.textContent = `${total}`
                prog.setAttribute('title', `${total} / ${nextRewardPoints(total)}`);
                elem.insertAdjacentElement("afterend", prog);
            }
        }
    }
}
