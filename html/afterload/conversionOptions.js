let hasFFmpeg = false;

const animateHiddenOptions = (node, ffmpegOptions, {
    expand=true, 
    immediate=false
}={}) => {
    const displayNone = ffmpegOptions.classList.contains(`d-none`);
    const originalMaxHeight = ffmpegOptions.style.maxHeight;

    if(displayNone) ffmpegOptions.classList.remove(`d-none`);
    ffmpegOptions.style.maxHeight = ``;

    const ffmpegBoundingClientRect = ffmpegOptions.getBoundingClientRect()

    if(displayNone) ffmpegOptions.classList.add(`d-none`)
    ffmpegOptions.style.maxHeight = originalMaxHeight;

    const doExpand = expand && (ffmpegOptions.hasAttribute(`hidden`) ? ffmpegOptions.getAttribute(`hidden`) == `true` : displayNone);
    const doShrink = !expand && (ffmpegOptions.hasAttribute(`hidden`) ? ffmpegOptions.getAttribute(`hidden`) == `false` : !displayNone);

    console.log(`${doExpand ? `Opening` : doShrink ? `Closing` : `(${expand ? `supposed to open` : `supposed to close`}) No action to`} hidden options "${ffmpegOptions.id}" ${immediate ? `immediately` : `with animation`}`)

    const add = [
        parseInt(window.getComputedStyle(ffmpegOptions).marginBottom),
        parseInt(window.getComputedStyle(ffmpegOptions).marginTop),
        parseInt(window.getComputedStyle(node).marginTop),
    ]

    const newHeight = (ffmpegBoundingClientRect.height + add.reduce((a, b) => a + b, 0));

    if(doExpand) {
        anime.remove(ffmpegOptions);

        ffmpegOptions.setAttribute(`hidden`, `false`);

        if(displayNone) ffmpegOptions.classList.remove(`d-none`);

        if(ffmpegOptions.querySelector(`#additional`)) {
            if(!config.advanced && !ffmpegOptions.querySelector(`#additional`).classList.contains(`d-none`)) {
                ffmpegOptions.querySelector(`#additional`).classList.add(`d-none`);
            } else if(config.advanced && ffmpegOptions.querySelector(`#additional`).classList.contains(`d-none`)) {
                ffmpegOptions.querySelector(`#additional`).classList.remove(`d-none`);
            };
            
            ffmpegOptions.querySelector(`#additional`).childNodes.forEach(n => {
                if(n && n.placeholder && n.id) n.value = ``;
            });
        }

        if(immediate) {
            ffmpegOptions.style.opacity = `100%`;
        } else if(config.reduceAnimations) {
            anime({
                targets: ffmpegOptions,
                opacity: [`0%`, `100%`],
                duration: 500,
                easing: `easeOutExpo`,
            });
        } else {
            anime({
                targets: ffmpegOptions,
                maxHeight: [`0px`, newHeight + `px`],
                opacity: [`0%`, `100%`],
                duration: 500,
                easing: `easeOutExpo`,
                complete: () => {
                    ffmpegOptions.style.maxHeight = ``;
                }
            });
        }
    } else if(doShrink) {
        anime.remove(ffmpegOptions);

        ffmpegOptions.setAttribute(`hidden`, `true`);

        if(immediate) {
            ffmpegOptions.style.opacity = `0%`;
            if(!ffmpegOptions.classList.contains(`d-none`)) ffmpegOptions.classList.add(`d-none`);
            if(ffmpegOptions.resetSelection) ffmpegOptions.resetSelection();
        } else if(config.reduceAnimations) {
            ffmpegOptions.style.maxHeight = `0px`;
            anime({
                targets: ffmpegOptions,
                opacity: [`100%`, `0%`],
                duration: 500,
                easing: `easeOutExpo`,
                complete: () => {
                    if(!ffmpegOptions.classList.contains(`d-none`)) ffmpegOptions.classList.add(`d-none`);
                    if(ffmpegOptions.resetSelection) ffmpegOptions.resetSelection();
                }
            });
        } else {
            anime({
                targets: ffmpegOptions,
                maxHeight: [ffmpegBoundingClientRect.height, `0px`],
                opacity: [`100%`, `0%`],
                duration: 500,
                easing: `easeOutExpo`,
                complete: () => {
                    if(!ffmpegOptions.classList.contains(`d-none`)) ffmpegOptions.classList.add(`d-none`);
                    if(ffmpegOptions.resetSelection) ffmpegOptions.resetSelection()
                    ffmpegOptions.style.maxHeight = ``;
                }
            });
        }
    };
};

const conversionOptions = (node, info) => {
    //node.querySelector(`#saveLocation`).placeholder = `${config && config.saveLocation ? config.saveLocation : `{default save location}`}`;
    //node.querySelector(`#saveLocation`).value = `${config && config.saveLocation ? config.saveLocation : ``}`;
    node.querySelector(`#basedir`).innerText = `${info.saveLocation || (config && config.saveLocation ? config.saveLocation : `Save Location`)}`;

    //console.log(`config`, config)

    //console.log(`video conversion enabled`)
    if(info.resolution) node.querySelector(`#videoResolution`).placeholder = `${info.resolution}`
    if(info.vbr) node.querySelector(`#videoBitrate`).placeholder = `Bitrate (${info.vbr}k)`
    if(info.fps) node.querySelector(`#videoFPS`).placeholder = `FPS (${info.fps})`

    //console.log(`audio conversion enabled`)
    if(info.asr) node.querySelector(`#audioSampleRate`).placeholder = `Sample Rate (${info.asr/1000}k)`
    if(info.abr) node.querySelector(`#audioBitrate`).placeholder = `Bitrate (${info.abr}k)`;

    const metaButtons = node.querySelector(`#metadataOptions`).querySelectorAll(`.btn`)

    const presetButtonClone = node.querySelector(`#ffmpegOptions`) ? node.querySelector(`#ffmpegOptions`).querySelector(`#custom`).cloneNode(true) : null;
    
    if(hasFFmpeg) {
        const conversionFormats = {
            mp4: {
                name: `MP4 / H.264`,
                description: `Default Video Format`,
                icon: `fa-video`,
                options: {
                    ext: `mp3`,
                    videoCodec: `h264`
                }
            },
            mp3: {
                name: `MP3 / AAC`,
                description: `Default Audio Format`,
                icon: `fa-volume-up`,
                options: {
                    ext: `mp3`,
                    videoCodec: false,
                    audioCodec: `aac`
                }
            },
            gif: {
                name: `GIF`,
                description: `it's pronounced gif btw`,
                icon: `fa-image`,
                options: {
                    ext: `gif`,
                    videoCodec: false,
                    additionalOutputArgs: [`-filter_complex`, `split[v1][v2]; [v1]palettegen=stats_mode=full [palette]; [v2][palette]paletteuse=dither=sierra2_4a`],
                }
            },
            custom: {
                name: `Custom Format`,
                description: `Customize your conversion!`,
                icon: `fa-wrench`,
            },
        }

        node.querySelector(`#convertDownload`).onclick = () => {
            const ffmpegOptions = node.querySelector(`#ffmpegOptions`);

            const customPresetButton = ffmpegOptions.querySelector(`#custom`);

            for(const format of Object.entries(conversionFormats)) {
                const key = format[0], options = format[1];

                if(!ffmpegOptions.querySelector(`#${key}`)) {
                    const thisNode = presetButtonClone.cloneNode(true);
                    thisNode.id = `${key}`;
                    thisNode.querySelector(`#name`).innerText = options.name;
                    thisNode.querySelector(`#description`).innerText = options.description;
                    thisNode.querySelector(`#icon`).className = `fas ${options.icon}`;
                    customPresetButton.parentElement.appendChild(thisNode);
                } else customPresetButton.parentElement.appendChild(ffmpegOptions.querySelector(`#${key}`))

                const node = ffmpegOptions.querySelector(`#${key}`);
                
                if(options.options) node.setAttribute(`options`, JSON.stringify(options.options));
            };

            const buttons = ffmpegOptions.querySelectorAll(`.formatPreset`);

            let currentSelected = null;

            const setPreset = (node, instant) => {
                if(node && currentSelected == node.id) {
                    buttonDisabledAnim(node, {noRemove: true});
                } else {
                    const previousSelected = currentSelected;
                    currentSelected = node ? node.id : null;
                    info.selectedConversion = currentSelected && conversionFormats[currentSelected] ? Object.assign({}, conversionFormats[currentSelected], { key: currentSelected }) : null;
                    buttons.forEach(btn => {
                        if(btn.id && btn.style) {
                            if(btn.id == currentSelected) {
                                if(btn.id == previousSelected) return;

                                anime.remove(btn);

                                anime({
                                    targets: btn,
                                    scale: 1.1,
                                    backgroundColor: `rgb(0, 0, 0)`,
                                    color: `rgb(255, 255, 255)`,
                                    duration: instant ? 0 : 300,
                                    easing: `easeOutCirc`,
                                });

                                if(btn.id == `custom`) {
                                    animateHiddenOptions(node, ffmpegOptions.querySelector(`#ffmpegCustomOptions`));
                                } else {
                                    animateHiddenOptions(node, ffmpegOptions.querySelector(`#ffmpegCustomOptions`), {expand: false});
                                }
                            } else if(btn.id == previousSelected || previousSelected == null) {
                                anime.remove(btn);
                                
                                anime({
                                    targets: btn,
                                    scale: 0.94,
                                    backgroundColor: presetButtonClone.style.backgroundColor,
                                    color: presetButtonClone.style.color,
                                    opacity: 0.9,
                                    duration: instant ? 0 : 300,
                                    easing: `easeOutCirc`,
                                })
                            }
                        }
                    })
                }
            };

            ffmpegOptions.resetSelection = () => setPreset(null, true);

            if(!ffmpegOptions.hasAttribute(`default`)) ffmpegOptions.setAttribute(`default`, `mp4`)

            buttons.forEach(node => {
                if(node.id) node.onclick = () => setPreset(node);
            });

            const defaultOption = ffmpegOptions.getAttribute(`default`);

            const usableOption = conversionFormats[defaultOption] ? defaultOption : null;

            console.log(`default option: ${defaultOption} -- parsed: ${usableOption}`)

            setPreset(usableOption ? ffmpegOptions.querySelector(`#${usableOption}`) || null : null, true); // set default preset
    
            const formattxtbox = node.querySelector(`#outputExtension`);
    
            formattxtbox.parentElement.removeChild(formattxtbox);
    
            node.querySelector(`#conversionDiv`).appendChild(formattxtbox);

            animateHiddenOptions(node, ffmpegOptions);
    
            anime({
                targets: node.querySelector(`#convertDownload`),
                width: [`49%`, `0%`],
                maxWidth: [`49%`, `0%`],
                padding: 0,
                opacity: [1, 0],
                duration: 500,
                easing: `easeOutExpo`,
            });
    
            anime({
                targets: node.querySelector(`#confirmDownload`),
                width: [`49%`, `100%`],
                duration: 500,
                easing: `easeOutExpo`,
            });
        }

        metaButtons.forEach(m => {
            const icon = m.querySelector(`#icon`);
    
            m.onclick = () => {
                if(m.getAttribute(`value`) == `true`) {
                    m.setAttribute(`value`, `false`);
                    if(icon.classList.contains(`fa-check-circle`)) {
                        icon.classList.remove(`fa-check-circle`);
                        icon.classList.add(`fa-times-circle`);
                    }
    
                    anime.remove(m);
                    anime({
                        targets: m,
                        scale: 0.9,
                        opacity: 0.65,
                        duration: 300,
                        easing: `easeOutExpo`,
                    })
                } else {
                    m.setAttribute(`value`, `true`);
                    if(icon.classList.contains(`fa-times-circle`)) {
                        icon.classList.remove(`fa-times-circle`);
                        icon.classList.add(`fa-check-circle`);
                    }
    
                    anime.remove(m);
                    anime({
                        targets: m,
                        scale: 1,
                        opacity: 1,
                        duration: 300,
                        easing: `easeOutExpo`,
                    })
                }
            }
        });
    } else {
        let sentNotif = false;
        metaButtons.forEach(m => {
            const icon = m.querySelector(`#icon`);
            m.style.scale = 0.9;
            m.style.opacity = 0.65;
            m.onclick = () => {
                if(!sentNotif) {
                    sentNotif = true;
                    createNotification({
                        headingText: `FFmpeg not found!`,
                        bodyText: `FFmpeg is required to add metadata. Please install FFmpeg and try again.`,
                        type: `warn`
                    });
                }
                buttonDisabledAnim(m, {
                    opacity: [0.75, 0.65],
                });
            }
            if(icon.classList.contains(`fa-check-circle`)) {
                icon.classList.remove(`fa-check-circle`);
                icon.classList.add(`fa-times-circle`);
            }
        });

        console.log(node.querySelector(`#confirmDownload`).parentElement, node.querySelector(`#convertDownload`))

        node.querySelector(`#confirmDownload`).style.width = `100%`;
        node.querySelector(`#convertDownload`).classList.add(`d-none`)
        //node.querySelector(`#convertDownload`).style.width = `0%`;
        //node.querySelector(`#convertDownload`).style.maxWidth = `0%`;
        //node.querySelector(`#convertDownload`).style.padding = `0px`;
        //node.querySelector(`#convertDownload`).style.opacity = `0`;
    }
}