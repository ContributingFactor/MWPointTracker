# MWPointTracker
![image](images/icon-128.png)

MWPointTracker is a Chrome browser extension for MakerWorld creators that displays total points earned by each model on a maker's profile page. The formula used corresponds to NumberOfDownloads + NumberOfPrints * 2 and it's displayed on the web page next to the prints and download counters.

When a model is two points away from the next point reward, the points total will be shown in orange. If it's one point away, it will be shown in red.

![image](example.jpg)

## Installation
MWPointTracker is in active development and is not yet available in the Chrome web store. Currently it can only be used by downloading this repo's contents and installing it in Chrome as an Unpacked Extension.

- Click the green `<> Code` button on this page and select `Download ZIP`.
- Extract the downloaded zip file to your preferred location.
- Open `chrome://extensions/` in your browser
- On upper-right corner, enabled 'Developer Mode'
- On the right side click the `Load unpacked` button. A file browser will open. Navigate the filesystem and select the mwpointtracker directory you extracted that contains the `manifest.json` file.

## Usage
Once it's loaded, MWPointTracker will work automatically whenever you visit a profile page on MakerWorld.

## Contact
ContributingFactor - cfactorprints@gmail.com
