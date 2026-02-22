const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../public/images/blog/seedance');
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('Navigating to Feishu docs...');
    await page.goto('https://my.feishu.cn/wiki/DUWxw7ETDiUYpPkXXGmcnMocnGe', { waitUntil: 'load' });

    // scroll down a bit to ensure cases load
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(3000);

    const data = await page.evaluate(async () => {
        // find a good image (not icon)
        const allImgs = Array.from(document.querySelectorAll('img')).filter(img => {
            return img.width > 200 && img.height > 200 && (img.src || img.style.backgroundImage);
        });

        let imgSrc = null;
        if (allImgs.length > 0) {
            let img = allImgs[0];
            imgSrc = img.src;
            if (!imgSrc && img.style.backgroundImage) {
                const match = img.style.backgroundImage.match(/url\("?(.+?)"?\)/);
                if (match) imgSrc = match[1];
            }
        }

        const video = document.querySelector('video');
        let videoSrc = video ? video.src : null;
        if (!videoSrc && video) {
            const source = video.querySelector('source');
            if (source) videoSrc = source.src;
        }

        return { imgSrc, videoSrc };
    });

    console.log('Result URLs:', data);

    if (data.imgSrc && data.imgSrc.startsWith('http')) {
        console.log("Image URL is public:", data.imgSrc);
    }

    // For blob URLs we have to do it in-page
    if (data.imgSrc && data.imgSrc.startsWith('blob:')) {
        const base64Img = await page.evaluate(async (url) => {
            const resp = await fetch(url);
            const blob = await resp.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        }, data.imgSrc);

        if (base64Img) {
            const base64Data = base64Img.replace(/^data:image\/\w+;base64,/, "");
            fs.writeFileSync(path.join(targetDir, 'demo-image.jpg'), base64Data, { encoding: 'base64' });
            console.log('Saved demo-image.jpg');
        }
    }

    if (data.videoSrc && data.videoSrc.startsWith('blob:')) {
        // for video, we fetch blob and convert to object URL, download
        // downloading large blob via base64 can crash, but we try
        try {
            const base64Vid = await page.evaluate(async (url) => {
                const resp = await fetch(url);
                const blob = await resp.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            }, data.videoSrc);

            if (base64Vid) {
                const base64Data = base64Vid.replace(/^data:video\/\w+;base64,/, "");
                fs.writeFileSync(path.join(targetDir, 'demo-video.mp4'), base64Data, { encoding: 'base64' });
                console.log('Saved demo-video.mp4');
            }
        } catch (e) {
            console.log("Video download failed:", e.message);
        }
    }

    await browser.close();
})();
