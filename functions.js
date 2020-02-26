let combinedList = [];

const saveData = (blob, fileName) => {
    let a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";

    let url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
};

const exportMDList = () => {
    let mdList = [];
    combinedList.forEach(x => {
        if (!x['md']) return;

        return mdList.push({comic_id: `${x['md']['id']}`});
    });
    let blob = new Blob([JSON.stringify(mdList)], {type: "text/plain; encoding=utf8"});
    saveData(blob, 'MD_EXPORT_' + Date.now() / 1000 + '.json');
};

const exportMRList = () => {
    let blob = new Blob([JSON.stringify(combinedList.map(x => x['mr']), null, 4)], {type: "text/plain; encoding=utf8"});
    saveData(blob, 'MR_EXPORT_' + Date.now() / 1000 + '.json');
};

const exportList = async () => {
    let email = $('#email').val();
    let pass = $('#pass').val();

    if (email === "" || pass === "") {
        $('body')
            .toast({
                class: 'error',
                message: `Please enter an email and password.`
            });
        return
    }

    if (!(await app.checkExistUser(email)) || !(await app.verifyPassword(email, pass))) {
        console.log(`User info incorrect`);
        $('body')
            .toast({
                class: 'error',
                message: `Please check your info and try again.`
            });
        return;
    };

    $('#box').hide();
    $('#loader').fadeIn(500);

    try {
        let token = await app.signIn(email, pass, true);

        let mangaList = await app.getMangaInfo(token);

        if (mangaList === undefined || mangaList === null) {
            console.log("Could not get MR List");
            return;
        }

        console.log(`Found ${mangaList.length} manga on MR`);

        $('#login').fadeOut(500);

        combinedList = await app.MRtoMD(mangaList);

        $('#loader').fadeOut(500);
        $('#list').fadeIn(500);

        for (let item of combinedList) {
            if (!item['md']) {
                $('#mr_list').append(`
                            <div class="ui fluid horizontal card">
                                <div class="manga-image" style="background-image: url('${item['mr']['thumbnail']}')" />
                                <div class="content manga-desc">
                                    <h3 class="header">${item['mr']['name']}</h3>
                                    <div class="description">${item['mr']['description'].trim()}</div>
                                </div>
                            </div>`);

                $('#md_list').append(`
                            <div class="ui fluid horizontal card">
                                <div class="manga-image" style="background-image: url('http://placehold.jp/cccccc/8f8f8f/300x450.png?text=Manga%20Not%20Found')" />
                                <div class="content manga-desc">
                                    <h3 class="header">Manga not found</h3>
                                    <div class="description">The manga <b>${item['mr']['name']}</b> could not be found on MangaDex</div>
                                </div>
                            </div>`);
            } else {
                Object.keys(item).forEach(key => {
                    if (key === "mr") {
                        $('#mr_list').append(`
                                    <div class="ui fluid horizontal card">
                                        <div class="image manga-image" style="background-image: url('${item['mr']['thumbnail']}')" />
                                        <div class="content manga-desc">
                                            <h3 class="header">${item['mr']['name']}</h3>
                                            <div class="description">${item['mr']['description'].trim()}</div>
                                        </div>
                                    </div>
                                `);
                    } else {
                        $('#md_list').append(`
                                    <div class="ui fluid horizontal card">
                                        <div class="image manga-image" style="background-image: url('https://mangadex.org/images/manga/${item['md']['id']}.large.jpg?1537907572')" />
                                        <div class="content manga-desc">
                                            <h3 class="header">${item['md']['titles'][0]}</h3>
                                            <div class="description">${item['md']['description'].trim()}</div>
                                        </div>
                                    </div>
                                `);
                    }
                });
            }
        }


    } catch (e) {
        console.error(e);
    }
}