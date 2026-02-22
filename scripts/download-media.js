const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../public/images/blog/seedance');
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

(async () => {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('Navigating to Feishu docs...');
    await page.goto('https://my.feishu.cn/wiki/DUWxw7ETDiUYpPkXXGmcnMocnGe', { waitUntil: 'load' });

    console.log('Scrolling down to trigger content load...');
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(3000);

    console.log('Extracting one image...');
    // We use element screenshotting to bypass any CORS/Blob download issues for the image
    const imgElement = await page.evaluateHandle(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        // Find a large enough image that is likely a content image, not a tiny UI icon
        return imgs.find(img => img.width > 300 && img.height > 200);
    });

    if (imgElement) {
        await imgElement.screenshot({ path: path.join(targetDir, 'demo-image.jpg') });
        console.log('✅ Saved demo-image.jpg successfully.');
    } else {
        console.log('❌ Could not find a suitable image element.');
    }

    console.log('Extracting one video...');
    const videoData = await page.evaluate(async () => {
        const videos = document.querySelectorAll('video');
        if (videos.length === 0) return "No video elements found";

        const video = videos[0];
        let src = video.src;
        if (!src) {
            const source = video.querySelector('source');
            if (source) src = source.src;
        }

        if (!src) return "Video element found but no src attribute";

        try {
            // Fetch the video data as a Blob and convert to Base64
            const response = await fetch(src);
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            return "Fetch error: " + e.message;
        }
    });

    if (videoData && videoData.startsWith('data:')) {
        const base64Data = videoData.replace(/^data:video\/\w+;base64,/, "");
        fs.writeFileSync(path.join(targetDir, 'demo-video.mp4'), base64Data, { encoding: 'base64' });
        console.log('✅ Saved demo-video.mp4 successfully.');
    } else {
        console.log('❌ Failed to extract video:', videoData);
    }

    await browser.close();
})();
