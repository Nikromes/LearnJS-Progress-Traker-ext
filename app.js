const storageType = 'local';

class LearnProgress {
    constructor(userProgress = {}, pagesStructure = {}) {
        this.userProgress = userProgress;
        this.pagesStructure = pagesStructure;
    }

    async init() {
        this.getColorTheme();
        this.getCurrentPage();
        await this.getUserProgress();
        await this.getPagesStracture();
    }
    changeColorTheme() {
        const progressBarBody = document.querySelector('.user-progress-progressbar');
        const progressButtons = document.querySelectorAll('.progress-button');

        if (progressBarBody) {
            progressBarBody.classList.toggle('progressbar-light')
        }
        if (progressButtons) {
            for (let progressButton of progressButtons) {
                progressButton.classList.toggle('progress-button-light');
            }
        }
    }
    getColorTheme() {
        const colorTheme = document.querySelector('html').getAttribute('data-theme');
        this.colorTheme = colorTheme;
    }
    getCurrentPage() {
        const pageUrl = window.location.href;
        const urlSplited = pageUrl.split('/');
        let currentPage = urlSplited[urlSplited.length - 1];
        if (currentPage.includes('#')) {
            currentPage = currentPage.split('#')[0];
        }
        this.pageUrl = pageUrl;
        this.currentPage = currentPage;
    }
    clearLocalStorage() {
        localStorage.clear();
    }
    async clearExtLocalStorage() {
        await chrome.storage[storageType].clear().then(() => {})
    }
    async getUserProgress() {
        let learnProgress;
        await chrome.storage[storageType].get(['learnProgress']).then((data) => {
            if (data.learnProgress) {
                learnProgress = data.learnProgress;
            }
        });
        if (!learnProgress) {
            learnProgress = JSON.parse(localStorage.getItem('learnProgress'));

            if (learnProgress) {
                await chrome.storage[storageType].set({ 'learnProgress': learnProgress }).then(() => {});
            }
        }

        if (learnProgress) {
            this.userProgress = learnProgress;
        }
    }
    async getPagesStracture() {
        let pagesStructure;
        await chrome.storage[storageType].get(['pagesStructure']).then((data) => {
            if (data.pagesStructure) {
                pagesStructure = data.pagesStructure;
            }
        });
        if (!pagesStructure) {
            pagesStructure = JSON.parse(localStorage.getItem('pagesStructure'));

            if (pagesStructure) {
                await chrome.storage[storageType].set({ 'pagesStructure': pagesStructure }).then(() => {});
            }
        }
        if (pagesStructure) {
            this.pagesStructure = pagesStructure;
        }
    }
}

const learnProgress = new LearnProgress();

(async () => {
    await learnProgress.init();
    console.log(learnProgress);

    const { currentPage, pageUrl } = learnProgress;
    let { pagesStructure } = learnProgress;


    createExtensionInfo()



    for (const page of Object.entries(learnProgress.userProgress)) {
        const [key, value] = page;
        const pageLink = document.querySelector(`a[href="/${key}"]`);
        if (pageLink) {
            pageLink.classList.add(`link-${value}`);
        }
    }

    if (pageUrl === 'https://learn.javascript.ru/') {

        pagesStructure = {};
        const mainChapters = document.querySelectorAll('div.tabs__content-inner');
        if (mainChapters) {
            for (let chapter of mainChapters) {
                const chapterChildrenElement = chapter.children[0];
                if (!chapterChildrenElement.classList.contains('courses-container')) {

                    const chapterTitle = chapter.querySelector('.frontpage-content__title');
                    const chapterTitleText = chapterTitle.innerText;

                    pagesStructure[chapterTitleText] = {};

                    const subChapters = chapter.querySelectorAll('.list__item');
                    for (let subChapter of subChapters) {
                        const subChapterTitle = subChapter.querySelector('.list__link').innerText
                        pagesStructure[chapterTitleText][subChapterTitle] = {}

                        const subChapterPages = subChapter.querySelectorAll('.list-sub__link');
                        for (let subChapterPage of subChapterPages) {
                            const subChapterPageName = subChapterPage.innerText;
                            const subChapterPageLink = subChapterPage.getAttribute('href').substring(1);
                            pagesStructure[chapterTitleText][subChapterTitle][subChapterPageName] = subChapterPageLink;
                        }
                    }
                }
            }
            await chrome.storage[storageType].set({ 'pagesStructure': pagesStructure }).then(() => {});
            localStorage.setItem('pagesStructure', JSON.stringify(pagesStructure));
        }

        let cursesSection = localStorage.getItem('cursesSection');
        if (cursesSection === 'hidden') {
            const cursesSection = document.querySelector('.tabs__content-section_courses');
            cursesSection.style.display = 'none';
        }

        const cursesContainer = document.querySelector('.courses-container');
        const hideCursesBtn = document.createElement('div');
        hideCursesBtn.innerText = 'Не показывать больше';
        hideCursesBtn.classList.add('hide-curse-btn');
        cursesContainer.appendChild(hideCursesBtn);

        const contentBlocks = document.querySelectorAll('div > div.list');
        for (let i = 0; i < contentBlocks.length; i++) {
            const navMenu = document.querySelectorAll('.tabs__menu-button')[i];
            const blockNum = contentBlocks[i].querySelectorAll('.list-sub__item > div').length;
            const completed = contentBlocks[i].querySelectorAll('.link-completed').length;
            const progressCounter = document.createElement('div');
            progressCounter.innerText = `${completed}/${blockNum}`;
            progressCounter.classList.add('progress-counter');
            navMenu.appendChild(progressCounter);

            if (completed === blockNum) {
                navMenu.classList.add('active-completed');
                navMenu.classList.add('hover-completed');
            }
        }

        const totalPages = document.querySelectorAll('.list-sub__item > div');
        const totalCompleted = document.querySelectorAll('.link-completed');
        const totalRepeated = document.querySelectorAll('.link-repeated');
        const totalProgressPercent = ((totalCompleted.length + totalRepeated.length) / totalPages.length * 100).toFixed(1);
        const complitedProgressPercent = (totalCompleted.length / totalPages.length * 100).toFixed(1);
        const tabs = document.querySelector('div.tabs');
        const userProgressBlock = document.createElement('div');
        userProgressBlock.innerHTML = createUserProgressBlock(complitedProgressPercent);
        tabs.insertAdjacentElement('afterbegin', userProgressBlock);

        let completedPercent = totalCompleted.length / totalPages.length * 100;
        let repeatedPercent = totalRepeated.length / totalPages.length * 100;

        if (Number(totalProgressPercent) === 100) {
            completedPercent > repeatedPercent ? completedPercent += 0.1 : repeatedPercent += 0.1;
        }

        const completedProgressbar = document.querySelector('.user-progress-progressbar-completed');
        const repeatedProgressbar = document.querySelector('.user-progress-progressbar-repeated');
        completedProgressbar.style.width = `${completedPercent}%`;
        repeatedProgressbar.style.width = `${repeatedPercent}%`;
    }

    const links = document.querySelectorAll('li.breadcrumbs__item');
    if (links !== null) {
        if (links.length === 3) {

            const article = document.querySelector('article.formatted');
            const buttonsContainer = document.createElement('div');
            buttonsContainer.classList.add('complete-page-button-container');

            const pageState = learnProgress.userProgress[currentPage];

            const buttonsBody = createPageButtons(pageState);
            buttonsContainer.innerHTML = buttonsBody;
            article.appendChild(buttonsContainer);
        } else if (links.length === 1) {
            const chapterName = document.querySelector('.main__header-title').innerText;
            const linksList = document.querySelectorAll('.lessons-list__link');

            if (pagesStructure[chapterName]) {
                for (let link of linksList) {
                    const linkName = link.innerText;
                    if (pagesStructure[chapterName][linkName]) {
                        const subChapterPages = pagesStructure[chapterName][linkName];

                        let isCompleted = 0;
                        let isRepeated = 0;
                        const pagesCount = Object.entries(subChapterPages).length;
                        for (let page of Object.entries(subChapterPages)) {
                            const [key, value] = page;
                            if (learnProgress.userProgress[value]) {
                                learnProgress.userProgress[value] === 'completed' ? isCompleted++ : isRepeated++;
                            }
                        }
                        if (isCompleted === pagesCount) {
                            link.classList.add('link-completed');
                        } else if (isRepeated > 0) {
                            link.classList.add('link-repeated');
                        }
                    }
                }
            }
        }
    }

    const hideCursesBtn = document.querySelector('.hide-curse-btn');
    if (hideCursesBtn) {
        hideCursesBtn.addEventListener('click', () => {
            const cursesSection = document.querySelector('.tabs__content-section_courses');
            cursesSection.style.display = 'none';
            localStorage.setItem('cursesSection', 'hidden');
        })
    }
    const pageCompleteButton = document.querySelector('button.complete-page-button');
    const pageRepeatButton = document.querySelector('button.repeat-page-button');
    if (pageCompleteButton && pageRepeatButton) {

        pageCompleteButton.addEventListener('click', async () => {
            if (pageRepeatButton.classList.contains('repeated')) {
                pageRepeatButton.classList.remove('repeated');
            }

            learnProgress.getUserProgress();

            pageCompleteButton.classList.toggle('completed');

            if (pageCompleteButton.classList.contains('completed')) {
                learnProgress.userProgress[currentPage] = 'completed';
            } else {
                delete learnProgress.userProgress[currentPage];
            }
            await chrome.storage[storageType].set({ 'learnProgress': learnProgress.userProgress }).then(() => {});
            localStorage.setItem('learnProgress', JSON.stringify(learnProgress.userProgress));
        })

        pageRepeatButton.addEventListener('click', async () => {
            if (pageCompleteButton.classList.contains('completed')) {
                pageCompleteButton.classList.remove('completed');
            }

            learnProgress.getUserProgress();

            pageRepeatButton.classList.toggle('repeated');

            if (pageRepeatButton.classList.contains('repeated')) {
                learnProgress.userProgress[currentPage] = 'repeated';
            } else {
                delete learnProgress.userProgress[currentPage];
            }
            await chrome.storage[storageType].set({ 'learnProgress': learnProgress.userProgress }).then(() => {});
            localStorage.setItem('learnProgress', JSON.stringify(learnProgress.userProgress));
        })
    }

    const changeThemeButtons = document.querySelectorAll('.theme-changer__input');
    if (changeThemeButtons) {
        for (let changeThemeButton of changeThemeButtons) {
            changeThemeButton.addEventListener('click', learnProgress.changeColorTheme);
        }
    }
})()

function createPageButtons(pageState) {
    let checkButtonClassList = 'progress-button complete-page-button';
    let repeatButtonClassList = 'progress-button repeat-page-button';
    if (pageState === 'completed') {
        checkButtonClassList += ' completed';
    } else if (pageState === 'repeated') {
        repeatButtonClassList += ' repeated';
    }


    let progressButtonsThemeClass = '';
    if (learnProgress.colorTheme === 'light') {
        progressButtonsThemeClass = ' progress-button-light';
    }
    const checkSvg = `
        <svg class="progress-button-svg-icon check-svg-icon" width="62" height="62" viewBox="0 0 62 62" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M31 2.38461C15.2206 2.38461 2.38464 15.2206 2.38464 31C2.38464 46.7794 15.2206 59.6154 31 59.6154C46.7795 59.6154 59.6154 46.7794 59.6154 31C59.6154 15.2206 46.7795 2.38461 31 2.38461ZM31 7.15384C44.1992 7.15384 54.8462 17.8008 54.8462 31C54.8462 44.1992 44.1992 54.8462 31 54.8462C17.8008 54.8462 7.15387 44.1992 7.15387 31C7.15387 17.8008 17.8008 7.15384 31 7.15384ZM40.9856 16.8413C40.6316 16.8972 40.3336 17.0835 40.0914 17.4375L28.3919 34.8005L22.8774 29.3606C22.4024 28.6433 21.4895 28.5874 21.0145 29.0625L18.8534 31.2236C18.3783 31.9408 18.3783 32.9096 18.8534 33.3846L27.1995 41.7308C27.6746 41.973 28.3453 42.476 29.0625 42.476C29.5376 42.476 30.3014 42.2245 30.7765 41.5072L45.0842 20.4928C45.5592 19.7755 45.2891 19.1049 44.339 18.6298L41.9544 16.9159C41.7122 16.7948 41.3396 16.7855 40.9856 16.8413Z" fill="#4F9756"/>
        </svg>
    `;
    const repeatSvg = `
        <svg class="progress-button-svg-icon repeat-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M5.5,17.5H4V6.5h7.8L11,7.29a1,1,0,0,0,1.41,1.42l2.5-2.5a1,1,0,0,0,0-1.42l-2.5-2.5a1,1,0,0,0-1.41,0,1,1,0,0,0,0,1.42l.79.79H3a1,1,0,0,0-1,1v13a1,1,0,0,0,1,1H5.5a1,1,0,0,0,0-2ZM21,4.5H18.5a1,1,0,0,0,0,2H20v11H11.63l.79-.79a1,1,0,0,0,0-1.42,1,1,0,0,0-1.41,0l-2.5,2.5a1,1,0,0,0,0,1.42l2.5,2.5a1,1,0,0,0,1.41-1.42l-.79-.79H21a1,1,0,0,0,1-1V5.5A1,1,0,0,0,21,4.5Z"/>
        </svg>
    `;

    return `
        <!-- <div>
            <h2>Кнопки прогресса</h2>
            <p>Это кнопки расширения LearnJS progress tracker, на каждой странице учебника ты можешь выбрать один из двух вариантов</p>
        </div> -->
        <div class="progress-buttons-wrapper">
            <button class="${checkButtonClassList} ${progressButtonsThemeClass}">
                ${checkSvg}
            </button>
            <button class="${repeatButtonClassList} ${progressButtonsThemeClass}">
                ${repeatSvg}
            </button>
        </div>
    `;
}

function createUserProgressBlock(percent) {
    let progressbarThemeClass;
    if (learnProgress.colorTheme === 'light') {
        progressbarThemeClass = 'progressbar-light';
    }

    return `
        <div class="user-progress-block">
            <h2 class="user-progress-title">Изучено тем</h2>
            <p class="user-progress-description">Тут показан твой общий прогресс в изучении материала. Ты уже фронтенд разработчик на целых: </p>
            <div class="user-progress-percents">
                <div class="user-progress-percents-percent">${percent}%</div>
            </div>
            <div class="user-progress-progressbar ${progressbarThemeClass}">
                <div class="user-progress-progressbar-completed"></div>
                <div class="user-progress-progressbar-repeated"></div>
            </div>
        </div>
    `;
}

function createExtensionInfo() {
    const wrapper = document.createElement('div');
    wrapper.classList.add('learn-progress-info-wrapper');
    wrapper.innerHTML = getExtensionInfoHtml();

    const siteToolBar = document.querySelector('.sitetoolbar');
    const toolBarBook = siteToolBar.querySelector('.sitetoolbar__book-wrap');
    toolBarBook.insertAdjacentElement("beforebegin", wrapper);

    const infoButton = wrapper.querySelector('.learn-progress-info-button');
    if (infoButton) {
        infoButton.addEventListener('click', () => {
            console.log('Extension info');
        })
    }

}
function getExtensionInfoHtml() {
    return `
        <!--
            <div class="learn-progress-info-button">
                <div class="info-button-blob"></div>
            </div>
        -->
    `;
}