let list = document.querySelector('div.pageContent.MuiBox-root.mw-css-0');
let trackedUploads = [];
// Start undefined to force a read of the options.
let showProgressBar = true;

function readOptionsFromStorage() {
    chrome.storage.sync.get({ showProgressBar: true },
        (items) => {
            if (items && items.showProgressBar){
                showProgressBar = items.showProgressBar;
            }
        }
    );
}

function readOptionsAndCountDownloads() {
    chrome.storage.sync.get({ showProgressBar: true },
        (items) => {
            if (items){
                showProgressBar = items.showProgressBar;
            }
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
    list = document.querySelector('div.pageContent.MuiBox-root.mw-css-0');
    if (!list) return;
    const hasItems = list.querySelectorAll("[data-trackid$='_from_uploads']");
    if (!hasItems || hasItems.length === 0) {
        modelPageContent = document.querySelectorAll("span.mw-css-81vkv1");
        if (modelPageContent && modelPageContent.length === 3){
            const elem = document.querySelector('div.mw-css-pn2l0k');
            if (!elem) {
                return;
            }
            const trackId = document.querySelector('meta[property="og:title"]').content
            if (document.getElementById(trackId)) {
                return;
            }
            insertInformationBelowDiv(elem, modelPageContent[1].innerText, modelPageContent[2].innerText, trackId);
        }
    } else {
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
    let textColor = '#898989';
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

function insertInformationBelowDiv(elem, downloadsStr, printsStr, dataTrackId) {
    const numPrints = strToNumber(printsStr);
    const numDownloads = strToNumber(downloadsStr);
    const total = numDownloads + numPrints * 2;
    let textColor = getTotalValueColor(total);
    const badgeDiv = document.createElement("div");
    badgeDiv.id = dataTrackId;
    badgeDiv.style.display='flex';
    const badge = document.createElement("span");
    if (textColor) {
        badge.style.cssText = `color:${textColor}`;
    }
    badge.style.fontWeight = '500';
    badge.style.fontSize='12px';
    badge.style.textWrapMode="nowrap"
    badge.style.paddingRight='12px';
    badge.textContent = `P ${total}`
    badgeDiv.insertAdjacentElement("beforeend", badge);    
    elem.insertAdjacentElement("afterend", badgeDiv);

    // Add a progress bar that shows distance to next reward.
    // On mouse-over the tooltip will show:
    // current prints / next reward
    if (showProgressBar) {
        const prog = document.createElement('progress');
        prog.value = `${total % getRewardInterval(total)}`;
        prog.max = `${getRewardInterval(total)}`;
        prog.style.accentColor = 'limeGreen';
        prog.style.width = '100%';
                prog.textContent = `${total}`
        prog.setAttribute('title', `${total} / ${nextRewardPoints(total)}`);
        badgeDiv.insertAdjacentElement("beforeend", prog);
    }
}

function countDownloads() {
    const items = list.querySelectorAll("[data-trackid$='_from_uploads']");
    for (const item of items) {
        if (!item) {
            continue;
        }
        if ((trackedUploads.includes(item.dataset.trackid)) 
            || (document.getElementById(item.dataset.trackid))){
            continue;
        }
        trackedUploads.push(item.dataset.trackid);
        // The div we care about include a 'div.download_count'
        // IMPORTANT: The download_count div actually marks the number of prints
        const printsDiv = item.querySelector("div.download_count");
        // Get the boosts div and downloads div as the sibling of the prints div
        let sibs = getSiblings(printsDiv);

        // Filter clickable 'like' and other components added to the div
        sibs = sibs.filter((s) => !s.className.includes("clickable"));
        
        if (!sibs || sibs.length > 2) continue;
        // Prints is the sibling before the downloads
        const downloadsDiv = sibs[sibs.length-1];

        // Find the <span> value for each
        const printsStr = printsDiv.querySelector("span").textContent;
        const downloadsStr = downloadsDiv.querySelector("span").textContent;
        if (!printsStr || !downloadsStr) {
            continue;
        }

        const elem = item.querySelector('div.mw-css-b84z3');
        if (!elem) {
            continue;
        }

        insertInformationBelowDiv(elem, downloadsStr, printsStr, item.dataset.trackid);
    }
}
