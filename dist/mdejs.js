;/*! mdejs 30-10-2017 */
(function ( $ ) {
    $.fn.mdejs = function(options) {
        var re = window.RegExp,
            util = {},
            position = {},
            ui = {},
            SETTINGS = {lineLength: 72},
            ua = {
                isIE: /msie/.test(window.navigator.userAgent.toLowerCase()),
                isIE_5or6: /msie 6/.test(window.navigator.userAgent.toLowerCase()) || /msie 5/.test(window.navigator.userAgent.toLowerCase()),
                isOpera: /opera/.test(window.navigator.userAgent.toLowerCase()),
                isWin: /win/.test(window.navigator.platform.toLowerCase())
            };
        // The default text that appears in the dialog input box when entering
        // links.
        var imageDefaultText = "http://";
        var linkDefaultText = "http://";
        var undoManager;

        var defaults = {
            textColor: "#000",
            toolbars: [
                {
                    panels: [
                        {
                            buttons : [
                                {
                                    name : "bold",
                                    hotkey: "b",
                                    icon: "fa fa-bold",
                                    css_class : "",
                                    action: "doBold"
                                },
                                {
                                    name : "italic",
                                    hotkey: "i",
                                    icon: "fa fa-italic",
                                    css_class : "",
                                    action: "doItalic"
                                }

                            ]
                        },
                        {
                            buttons : [
                                {
                                    name : "heading",
                                    hotkey: "h",
                                    icon: "fa fa-header",
                                    css_class : "",
                                    action: "doHeading"
                                },
                                {
                                    name : "hr",
                                    hotkey: "",
                                    icon: "fa fa-ellipsis-h",
                                    css_class : "",
                                    action: "doHorizontalRule"
                                }
                            ]
                        },
                        {
                            buttons : [
                                {
                                    name : "ulist",
                                    hotkey: "u",
                                    icon: "fa fa-list-ul",
                                    css_class : "",
                                    action: "doUlList"
                                },
                                {
                                    name : "olist",
                                    hotkey: "o",
                                    icon: "fa fa-list-ol",
                                    css_class : "",
                                    action: "doOlList"
                                },
                                {
                                    name : "quote",
                                    hotkey: "q",
                                    icon: "fa fa-quote-right",
                                    css_class : "",
                                    action: "doBlockquote"
                                }
                            ]
                        },
                        {
                            buttons: [
                                {
                                    name : "code",
                                    hotkey: "k",
                                    icon: "fa fa-code",
                                    css_class : "",
                                    action: "doCode"
                                },
                                {
                                    name : "link",
                                    hotkey: "l",
                                    icon: "fa fa-link",
                                    css_class : "",
                                    action: "doLink"
                                },
                                {
                                    name : "image",
                                    hotkey: "g",
                                    icon: "fa fa-file-image-o",
                                    css_class : "",
                                    action: "doImage"
                                }
                            ]
                        },
                        {
                            buttons: [
                                {
                                    name : "undo",
                                    hotkey: "z",
                                    icon: "fa fa-undo",
                                    css_class : "",
                                    action: null,
                                    execute: function (manager) {
                                        return manager.undo();
                                    }
                                },
                                {
                                    name : "redo",
                                    icon: "fa fa-repeat",
                                    css_class : "",
                                    action: null,
                                    execute: function (manager) {
                                        return manager.redo();
                                    }
                                }
                            ]
                        }

                    ]
                }
            ],

            lang: {
                bold: "Жирный",
                boldexample: "Текст, выделенный жирным",

                italic: "Курсив",
                italicexample: "Текст, выделенный жирным",

                link: "Ссылка",
                linkdescription: "Описание ссылки",
                linkdialog: "<p><b>Вставить ссылку</b></p><p>http://yandex.ru/ \"Опциональная подсказка\"</p>",

                quote: "Цитата",
                quoteexample: "Текст цитаты",

                code: "Пример кода",
                codeexample: "Введите текст исходного кода",

                image: "Изображение",
                imagedescription: "Введите описание изображения",
                imagedialog: "<p><b>Вставка изображения</b></p><p>http://example.com/images/diagram.jpg \"Опцианальная подсказка\"<br><br>Нужен <a href='http://www.google.com/search?q=бесплатный+хостинг+картинок' target='_blank'>бесплатный хостинг картинок?</a></p>",

                olist: "Нумерованный список",
                ulist: "Маркированный список",
                litem: "Элемент списка",

                heading: "Заголовок h1/h2",
                headingexample: "Заголовок",

                hr: "Горизонтальная черта",

                undo: "Отменить — " + (ua.isWin ? 'Ctrl+Z' : '⌘Z'),
                redo: "Повторить — " + (ua.isWin ? 'Ctrl+Y' : '⇧⌘Z'),

                help: "Помощь"
            }
        };

        var settings = $.extend({}, defaults, options);

        // Returns true if the DOM element is visible, false if it's hidden.
        // Checks if display is anything other than none.
        util.isVisible = function (elem) {
            return $(elem).is(':visible');
        };

        // Adds a listener callback to a DOM element which is fired on a specified
        // event.
        util.addEvent = function (elem, event, listener) {
            if (elem.attachEvent) {
                // IE only.  The "on" is mandatory.
                elem.attachEvent("on" + event, listener);
            } else {
                // Other browsers.
                elem.addEventListener(event, listener, false);
            }
        };


        // Removes a listener callback from a DOM element which is fired on a specified
        // event.
        util.removeEvent = function (elem, event, listener) {
            if (elem.detachEvent) {
                // IE only.  The "on" is mandatory.
                elem.detachEvent("on" + event, listener);
            }
            else {
                // Other browsers.
                elem.removeEventListener(event, listener, false);
            }
        };

        // Converts \r\n and \r to \n.
        util.fixEolChars = function (text) {
            text = text.replace(/\r\n/g, "\n");
            text = text.replace(/\r/g, "\n");
            return text;
        };

        // Extends a regular expression.  Returns a new RegExp
        // using pre + regex + post as the expression.
        // Used in a few functions where we have a base
        // expression and we want to pre- or append some
        // conditions to it (e.g. adding "$" to the end).
        // The flags are unchanged.
        //
        // regex is a RegExp, pre and post are strings.
        util.extendRegExp = function (regex, pre, post) {

            if (pre === null || pre === undefined) {
                pre = "";
            }
            if (post === null || post === undefined) {
                post = "";
            }

            var pattern = regex.toString();
            var flags = null;

            // Replace the flags with empty space and store them.
            pattern = pattern.replace(/\/([gim]*)$/, function (wholeMatch, flagsPart) {
                flags = flagsPart;
                return "";
            });

            // Remove the slash delimiters on the regular expression.
            pattern = pattern.replace(/(^\/|\/$)/g, "");
            pattern = pre + pattern + post;

            return new re(pattern, flags);
        };

        // UNFINISHED
        // The assignment in the while loop makes jslint cranky.
        // I'll change it to a better loop later.
        position.getTop = function (elem, isInner) {
            var result = elem.offsetTop;
            if (!isInner) {
                while (elem = elem.offsetParent) {
                    result += elem.offsetTop;
                }
            }
            return result;
        };

        position.getHeight = function (elem) {
            return elem.offsetHeight || elem.scrollHeight;
        };

        position.getWidth = function (elem) {
            return elem.offsetWidth || elem.scrollWidth;
        };

        function PanelCollection(element, options) {
            this.input = element[0];
            //console.log(options);
            this.preview = document.getElementsByClassName(options.preview_class)[0];

            //console.log(options);

            this.buttonBar = document.createElement("div");
            this.buttonBar.className = "mde-toolbar";
            this.input.parentNode.insertBefore(this.buttonBar, this.input);
        }


        // options, if given, can have the following properties:
        //   options.helpButton = { handler: yourEventHandler }
        //   options.strings = { italicexample: "slanted text" }
        // `yourEventHandler` is the click handler for the help button.
        // If `options.helpButton` isn't given, not help button is created.
        // `options.strings` can have any or all of the same properties as
        // `defaultStrings` above, so you can just override some string displayed
        // to the user on a case-by-case basis, or translate all strings to
        // a different language.
        //
        // For backwards compatibility reasons, the `options` argument can also
        // be just the `helpButton` object, and `strings.help` can also be set via
        // `helpButton.title`. This should be considered legacy.
        //
        // The constructed editor object has the methods:
        // - getConverter() returns the markdown converter object that was passed to the constructor
        // - run() actually starts the editor; should be called after all necessary plugins are registered. Calling this more than once is a no-op.
        // - refreshPreview() forces the preview to be updated. This method is only available after run() was called.
        function Editor (markdownConverter, options) {
            options = options || {};
            options.lang = options.lang || {};
            options.helpButton = options.helpButton || {};

            var getString = function (identifier) {
                return options.lang[identifier] || defaults.lang[identifier];
            };

            //var hooks = this.hooks = new Markdown.HookCollection();
            //hooks.addNoop("onPreviewRefresh");       // called with no arguments after the preview has been refreshed
            //hooks.addNoop("postBlockquoteCreation"); // called with the user's selection *after* the blockquote was created; should return the actual to-be-inserted text
            //hooks.addFalse("insertImageDialog");

            var that = this, panel;
            this.run = function (element) {
                if (panel) {
                    return; // already initialized
                }

                panel = new PanelCollection(element, options);

                var uiManager;

                var previewManager = new PreviewManager(markdownConverter, panel, function () {
                    //hooks.onPreviewRefresh();
                });

                if (!/\?noundo/.test(document.location.href)) {
                    undoManager = new UndoManager(function () {
                        previewManager.refresh();
                        if (uiManager) {
                            uiManager.setUndoRedoButtonStates();
                        }
                    }, panel);
                }

                var commandManager = new CommandManager(getString, markdownConverter);

                // undoManager,
                uiManager = new UIManager(options, panel, previewManager, commandManager, options.helpButton, getString);
                uiManager.setUndoRedoButtonStates();

                var forceRefresh = that.refreshPreview = function () {
                    previewManager.refresh(true);
                };

                forceRefresh();
            };

        }

        // text: The html for the input box.
        // defaultInputText: The default value that appears in the input box.
        // callback: The function which is executed when the prompt is dismissed, either via OK or Cancel.
        //      It receives a single argument; either the entered text (if OK was chosen) or null (if Cancel
        //      was chosen).
        ui.prompt = function (text, defaultInputText, callback) {
            $('<div id="mdejs-prompt-dialog" class="modal fade" tabindex="-1" role="dialog">' +
                '<div class="modal-dialog modal-md">' +
                '<div class="modal-content"><form class="mde-dialog-form">' +
                '<div class="modal-body">' + text +
                '<div class="input-group input-group-sm" style="width:100%">' +
                '<input class="form-control mde-dialog-input" type="text" value="' + defaultInputText + '">' +
                '</div>' +
                '</div>' +

                '<div class="modal-footer">' +
                '<button type="button" class="btn btn-primary mde-process-modal">Ok</button>' +
                '<button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>' +
                '</div>' +

                '</form></div>' +
                '</div></div>').appendTo($(document.body));

            var modalWindow = $('#mdejs-prompt-dialog');

            modalWindow.on('shown.bs.modal', function () {
                var mdeDialogInput = $('.mde-dialog-input');
                mdeDialogInput.focus();

                // Move caret at the end
                var val = mdeDialogInput.val();
                mdeDialogInput.val('').val(val);

                $('.mde-dialog-form', $(this)).submit(function () {
                    processForm();
                    modalWindow.modal('hide');
                    return false;
                });
            });

            $('.mde-process-modal', modalWindow).click(function () {
                processForm();
                modalWindow.modal('hide');
            });

            modalWindow.on('hide.bs.modal', function () {
                modalWindow.remove();
            });

            modalWindow.modal();

            var processForm = function () {
                // Fixes common pasting errors.
                text = $('.mde-dialog-input').val().replace(/^http:\/\/(https?|ftp):\/\//, '$1://');
                if (!/^(?:https?|ftp):\/\//.test(text)) {
                    text = 'http://' + text;
                }
                callback(text);
            };
        };

        // before: contains all the text in the input box BEFORE the selection.
        // after: contains all the text in the input box AFTER the selection.
        function Chunks() { }

        // startRegex: a regular expression to find the start tag
        // endRegex: a regular expresssion to find the end tag
        Chunks.prototype.findTags = function (startRegex, endRegex) {
            var chunkObj = this;
            var regex;

            if (startRegex) {
                regex = util.extendRegExp(startRegex, "", "$");
                this.before = this.before.replace(regex,
                    function (match) {
                        chunkObj.startTag = chunkObj.startTag + match;
                        return "";
                    });

                regex = util.extendRegExp(startRegex, "^", "");

                this.selection = this.selection.replace(regex,
                    function (match) {
                        chunkObj.startTag = chunkObj.startTag + match;
                        return "";
                    });
            }

            if (endRegex) {
                regex = util.extendRegExp(endRegex, "", "$");

                this.selection = this.selection.replace(regex,
                    function (match) {
                        chunkObj.endTag = match + chunkObj.endTag;
                        return "";
                    });

                regex = util.extendRegExp(endRegex, "^", "");

                this.after = this.after.replace(regex,
                    function (match) {
                        chunkObj.endTag = match + chunkObj.endTag;
                        return "";
                    });
            }
        };

        // If remove is false, the whitespace is transferred
        // to the before/after regions.
        //
        // If remove is true, the whitespace disappears.
        Chunks.prototype.trimWhitespace = function (remove)
        {
            var beforeReplacer, afterReplacer, that = this;

            if (remove) {
                beforeReplacer = afterReplacer = "";
            } else {
                beforeReplacer = function (s) {
                    that.before += s;
                    return "";
                };
                afterReplacer = function (s) {
                    that.after = s + that.after;
                    return "";
                };
            }

            this.selection = this.selection.replace(/^(\s*)/, beforeReplacer).replace(/(\s*)$/, afterReplacer);
        };


        Chunks.prototype.skipLines = function (nLinesBefore, nLinesAfter, findExtraNewlines)
        {
            if (nLinesBefore === undefined) {
                nLinesBefore = 1;
            }

            if (nLinesAfter === undefined) {
                nLinesAfter = 1;
            }

            nLinesBefore++;
            nLinesAfter++;

            var regexText;
            var replacementText;

            // chrome bug ... documented at: http://meta.stackexchange.com/questions/63307/blockquote-glitch-in-editor-in-chrome-6-and-7/65985#65985
            if (navigator.userAgent.match(/Chrome/)) {
                "X".match(/()./);
            }

            this.selection = this.selection.replace(/(^\n*)/, "");
            this.startTag = this.startTag + re.$1;

            this.selection = this.selection.replace(/(\n*$)/, "");
            this.endTag = this.endTag + re.$1;
            this.startTag = this.startTag.replace(/(^\n*)/, "");
            this.before = this.before + re.$1;
            this.endTag = this.endTag.replace(/(\n*$)/, "");
            this.after = this.after + re.$1;

            if (this.before) {
                regexText = replacementText = "";

                while (nLinesBefore--) {
                    regexText += "\\n?";
                    replacementText += "\n";
                }

                if (findExtraNewlines) {
                    regexText = "\\n*";
                }
                this.before = this.before.replace(new re(regexText + "$", ""), replacementText);
            }

            if (this.after) {
                regexText = replacementText = "";

                while (nLinesAfter--) {
                    regexText += "\\n?";
                    replacementText += "\n";
                }
                if (findExtraNewlines) {
                    regexText = "\\n*";
                }

                this.after = this.after.replace(new re(regexText, ""), replacementText);
            }
        };

        // Handles pushing and popping TextareaStates for undo/redo commands.
        // I should rename the stack variables to list.
        function UndoManager(callback, panels) {

            var undoObj = this;
            var undoStack = []; // A stack of undo states
            var stackPtr = 0; // The index of the current state
            var mode = "none";
            var lastState; // The last state
            var timer; // The setTimeout handle for cancelling the timer
            var inputStateObj;

            // Set the mode for later logic steps.
            var setMode = function (newMode, noSave) {
                if (mode != newMode) {
                    mode = newMode;
                    if (!noSave) {
                        saveState();
                    }
                }

                if (!ua.isIE || mode != "moving") {
                    timer = setTimeout(refreshState, 1);
                }
                else {
                    inputStateObj = null;
                }
            };

            var refreshState = function (isInitialState) {
                inputStateObj = new TextareaState(panels, isInitialState);
                timer = undefined;
            };

            this.setCommandMode = function () {
                mode = "command";
                saveState();
                timer = setTimeout(refreshState, 0);
            };

            this.canUndo = function () {
                return stackPtr > 1;
            };

            this.canRedo = function () {
                return !!undoStack[stackPtr + 1];
            };

            // Removes the last state and restores it.
            this.undo = function () {
                if (undoObj.canUndo()) {
                    if (lastState) {
                        // What about setting state -1 to null or checking for undefined?
                        lastState.restore();
                        lastState = null;
                    } else {
                        undoStack[stackPtr] = new TextareaState(panels);
                        undoStack[--stackPtr].restore();

                        if (callback) {
                            callback();
                        }
                    }
                }

                mode = "none";
                panels.input.focus();
                refreshState();
            };

            // Redo an action.
            this.redo = function () {

                if (undoObj.canRedo()) {

                    undoStack[++stackPtr].restore();

                    if (callback) {
                        callback();
                    }
                }

                mode = "none";
                panels.input.focus();
                refreshState();
            };

            // Push the input area state to the stack.
            var saveState = function () {
                var currState = inputStateObj || new TextareaState(panels);

                if (!currState) {
                    return false;
                }
                if (mode == "moving") {
                    if (!lastState) {
                        lastState = currState;
                    }
                    return;
                }
                if (lastState) {
                    if (undoStack[stackPtr - 1].text != lastState.text) {
                        undoStack[stackPtr++] = lastState;
                    }
                    lastState = null;
                }
                undoStack[stackPtr++] = currState;
                undoStack[stackPtr + 1] = null;
                if (callback) {
                    callback();
                }
            };

            var handleCtrlYZ = function (event) {

                var handled = false;

                if ((event.ctrlKey || event.metaKey) && !event.altKey) {

                    // IE and Opera do not support charCode.
                    var keyCode = event.charCode || event.keyCode;
                    var keyCodeChar = String.fromCharCode(keyCode);

                    switch (keyCodeChar.toLowerCase()) {

                        case "y":
                            undoObj.redo();
                            handled = true;
                            break;

                        case "z":
                            if (!event.shiftKey) {
                                undoObj.undo();
                            }
                            else {
                                undoObj.redo();
                            }
                            handled = true;
                            break;
                    }
                }

                if (handled) {
                    if (event.preventDefault) {
                        event.preventDefault();
                    }
                    if (window.event) {
                        window.event.returnValue = false;
                    }

                    return null;
                }
            };

            // Set the mode depending on what is going on in the input area.
            var handleModeChange = function (event) {
                if (!event.ctrlKey && !event.metaKey) {
                    var keyCode = event.keyCode;

                    if ((keyCode >= 33 && keyCode <= 40) || (keyCode >= 63232 && keyCode <= 63235)) {
                        // 33 - 40: page up/dn and arrow keys
                        // 63232 - 63235: page up/dn and arrow keys on safari
                        setMode("moving");
                    } else if (keyCode == 8 || keyCode == 46 || keyCode == 127) {
                        // 8: backspace
                        // 46: delete
                        // 127: delete
                        setMode("deleting");
                    } else if (keyCode == 13) {
                        // 13: Enter
                        setMode("newlines");
                    } else if (keyCode == 27) {
                        // 27: escape
                        setMode("escape");
                    } else if ((keyCode < 16 || keyCode > 20) && keyCode != 91) {
                        // 16-20 are shift, etc.
                        // 91: left window key
                        // I think this might be a little messed up since there are
                        // a lot of nonprinting keys above 20.
                        setMode("typing");
                    }
                }
            };

            var setEventHandlers = function () {
                $(panels.input).on("keypress", function (event) {
                    // keyCode 89: y
                    // keyCode 90: z
                    if ((event.ctrlKey || event.metaKey) && !event.altKey && (event.keyCode == 89 || event.keyCode == 90)) {
                        event.preventDefault();
                    }
                });

                var handlePaste = function () {
                    if (ua.isIE || (inputStateObj && inputStateObj.text != panels.input.value)) {
                        if (timer == undefined) {
                            mode = "paste";
                            saveState();
                            refreshState();
                        }
                    }
                };

                util.addEvent(panels.input, "keydown", handleCtrlYZ);
                util.addEvent(panels.input, "keydown", handleModeChange);
                util.addEvent(panels.input, "mousedown", function () {
                    setMode("moving");
                });

                panels.input.onpaste = handlePaste;
                panels.input.ondrop = handlePaste;
            };

            var init = function () {
                setEventHandlers();
                refreshState(true);
                saveState();
            };

            init();
        }

        // end of UndoManager

        // The input textarea state/contents.
        // This is used to implement undo/redo by the undo manager.
        function TextareaState(panels, isInitialState) {

            // Aliases
            var stateObj = this;
            var inputArea = panels.input;
            this.init = function () {
                if (!util.isVisible(inputArea)) {
                    return;
                }
                if (!isInitialState && document.activeElement && document.activeElement !== inputArea) { // this happens when tabbing out of the input box
                    return;
                }

                this.setInputAreaSelectionStartEnd();
                this.scrollTop = inputArea.scrollTop;
                if (!this.text && inputArea.selectionStart || inputArea.selectionStart === 0) {
                    this.text = inputArea.value;
                }

            };

            // Sets the selected text in the input box after we've performed an
            // operation.
            this.setInputAreaSelection = function ()
            {
                if (!util.isVisible(inputArea)) {
                    return;
                }

                if (inputArea.selectionStart !== undefined && !ua.isOpera) {
                    inputArea.focus();
                    inputArea.selectionStart = stateObj.start;
                    inputArea.selectionEnd = stateObj.end;
                    inputArea.scrollTop = stateObj.scrollTop;
                } else if (document.selection) {
                    if (document.activeElement && document.activeElement !== inputArea) {
                        return;
                    }

                    inputArea.focus();
                    var range = inputArea.createTextRange();
                    range.moveStart("character", -inputArea.value.length);
                    range.moveEnd("character", -inputArea.value.length);
                    range.moveEnd("character", stateObj.end);
                    range.moveStart("character", stateObj.start);
                    range.select();
                }
            };

            this.setInputAreaSelectionStartEnd = function ()
            {
                if (!panels.ieCachedRange && (inputArea.selectionStart || inputArea.selectionStart === 0)) {
                    stateObj.start = inputArea.selectionStart;
                    stateObj.end = inputArea.selectionEnd;
                } else if (document.selection) {

                    stateObj.text = util.fixEolChars(inputArea.value);

                    // IE loses the selection in the textarea when buttons are
                    // clicked.  On IE we cache the selection. Here, if something is cached,
                    // we take it.
                    var range = panels.ieCachedRange || document.selection.createRange();

                    var fixedRange = util.fixEolChars(range.text);
                    var marker = "\x07";
                    var markedRange = marker + fixedRange + marker;
                    range.text = markedRange;
                    var inputText = util.fixEolChars(inputArea.value);

                    range.moveStart("character", -markedRange.length);
                    range.text = fixedRange;

                    stateObj.start = inputText.indexOf(marker);
                    stateObj.end = inputText.lastIndexOf(marker) - marker.length;

                    var len = stateObj.text.length - util.fixEolChars(inputArea.value).length;

                    if (len) {
                        range.moveStart("character", -fixedRange.length);
                        while (len--) {
                            fixedRange += "\n";
                            stateObj.end += 1;
                        }
                        range.text = fixedRange;
                    }

                    if (panels.ieCachedRange) {
                        stateObj.scrollTop = panels.ieCachedScrollTop; // this is set alongside with ieCachedRange
                    }

                    panels.ieCachedRange = null;

                    this.setInputAreaSelection();
                }
            };

            // Restore this state into the input area.
            this.restore = function ()
            {
                if (stateObj.text != undefined && stateObj.text != inputArea.value) {
                    inputArea.value = stateObj.text;
                }
                this.setInputAreaSelection();
                inputArea.scrollTop = stateObj.scrollTop;
            };

            // Gets a collection of HTML chunks from the inptut textarea.
            this.getChunks = function ()
            {
                var chunk = new Chunks();
                chunk.before = util.fixEolChars(stateObj.text.substring(0, stateObj.start));
                chunk.startTag = "";
                chunk.selection = util.fixEolChars(stateObj.text.substring(stateObj.start, stateObj.end));
                chunk.endTag = "";
                chunk.after = util.fixEolChars(stateObj.text.substring(stateObj.end));
                chunk.scrollTop = stateObj.scrollTop;

                return chunk;
            };

            // Sets the TextareaState properties given a chunk of markdown.
            this.setChunks = function (chunk) {
                chunk.before = chunk.before + chunk.startTag;
                chunk.after = chunk.endTag + chunk.after;

                this.start = chunk.before.length;
                this.end = chunk.before.length + chunk.selection.length;
                this.text = chunk.before + chunk.selection + chunk.after;
                this.scrollTop = chunk.scrollTop;
            };
            this.init();
        }

        function PreviewManager(converter, panels, previewRefreshCallback)
        {
            var timeout;
            var elapsedTime;
            var oldInputText;
            var maxDelay = 3000;
            var startType = "delayed"; // The other legal value is "manual"

            // Adds event listeners to elements
            var setupEvents = function (inputElem, listener) {
                util.addEvent(inputElem, "input", listener);
                inputElem.onpaste = listener;
                inputElem.ondrop = listener;

                util.addEvent(inputElem, "keypress", listener);
                util.addEvent(inputElem, "keydown", listener);
            };

            var makePreviewHtml = function () {
                if (!panels.preview) {
                    return;
                }

                var text = panels.input.value;

                if (text && text == oldInputText) {
                    return; // Input text hasn't changed.
                } else {
                    oldInputText = text;
                }

                var prevTime = new Date().getTime();
                text = settings.converter.makeHtml(text);
                // Calculate the processing time of the HTML creation.
                // It's used as the delay time in the event listener.
                var currTime = new Date().getTime();
                elapsedTime = currTime - prevTime;

                pushPreviewHtml(text);
            };

            // setTimeout is already used.  Used as an event listener.
            var applyTimeout = function () {

                if (timeout) {
                    clearTimeout(timeout);
                    timeout = undefined;
                }

                if (startType !== "manual") {

                    var delay = 0;

                    if (startType === "delayed") {
                        delay = elapsedTime;
                    }

                    if (delay > maxDelay) {
                        delay = maxDelay;
                    }
                    timeout = setTimeout(makePreviewHtml, delay);
                }
            };

            var getScaleFactor = function (panel) {
                if (panel.scrollHeight <= panel.clientHeight) {
                    return 1;
                }
                return panel.scrollTop / (panel.scrollHeight - panel.clientHeight);
            };

            var setPanelScrollTops = function () {
                if (panels.preview) {
                    //panels.preview.scrollTop = (panels.preview.scrollHeight - panels.preview.clientHeight) * getScaleFactor(panels.preview);
                }
            };

            this.refresh = function (requiresRefresh) {

                if (requiresRefresh) {
                    oldInputText = "";
                    makePreviewHtml();
                } else {
                    applyTimeout();
                }
            };

            this.processingTime = function () {
                return elapsedTime;
            };

            var isFirstTimeFilled = true;

            // IE doesn't let you use innerHTML if the element is contained somewhere in a table
            // (which is the case for inline editing) -- in that case, detach the element, set the
            // value, and reattach. Yes, that *is* ridiculous.
            var ieSafePreviewSet = function (text) {
                var preview = panels.preview;
                var parent = preview.parentNode;
                var sibling = preview.nextSibling;
                parent.removeChild(preview);
                preview.innerHTML = text;
                if (!sibling)
                    parent.appendChild(preview);
                else
                    parent.insertBefore(preview, sibling);
            };

            var nonSuckyBrowserPreviewSet = function (text) {
                panels.preview.innerHTML = text;
            };

            var previewSetter;

            var previewSet = function (text) {
                if (previewSetter) {
                    return previewSetter(text);
                }

                try {
                    nonSuckyBrowserPreviewSet(text);
                    previewSetter = nonSuckyBrowserPreviewSet;
                } catch (e) {
                    previewSetter = ieSafePreviewSet;
                    previewSetter(text);
                }
            };

            var pushPreviewHtml = function (text) {
                var docScrollTop = $(document).scrollTop();
                var emptyTop = position.getTop(panels.input) - docScrollTop;

                if (panels.preview) {
                    previewSet(text);
                    previewRefreshCallback();
                }

                setPanelScrollTops();

                if (isFirstTimeFilled) {
                    isFirstTimeFilled = false;
                    return;
                }

                var fullTop = position.getTop(panels.input) - docScrollTop;

                if (ua.isIE) {
                    setTimeout(function () {
                        window.scrollBy(0, fullTop - emptyTop);
                    }, 0);
                } else {
                    window.scrollBy(0, fullTop - emptyTop);
                }
            };

            var init = function () {
                setupEvents(panels.input, applyTimeout);
                makePreviewHtml();

                if (panels.preview) {
                    panels.preview.scrollTop = 0;
                }
            };

            init();
        }

        function UIManager(options, panels, previewManager, commandManager, helpOptions, getString)
        {
            var inputBox = panels.input,
                panelButtons = {},
                buttons = {}; // buttons.undo, buttons.link, etc. The actual DOM elements.

            makeSpritedButtonRow();

            var keyEvent = "keydown";
            if (ua.isOpera) {
                keyEvent = "keypress";
            }

            $(inputBox).on(keyEvent, function (key) {
                // Check to see if we have a button key and, if so execute the callback.
                if ((key.ctrlKey || key.metaKey) && !key.altKey && !key.shiftKey) {
                    var keyCode = key.charCode || key.keyCode;
                    var keyCodeStr = String.fromCharCode(keyCode).toLowerCase();

                    $.each(panelButtons, function (i, button) {
                        if (button.hotkey && button.hotkey.toLowerCase() == keyCodeStr) {
                            doClick(buttons[i]);
                            key.preventDefault();
                        }
                    });

                    return null;
                }
            });

            // Auto-indent on shift-enter
            util.addEvent(inputBox, "keyup", function (key) {
                if (!key.shiftKey && !key.ctrlKey && !key.metaKey) {
                    var keyCode = key.charCode || key.keyCode;
                    // Character 13 is Enter
                    if (keyCode === 13) {
                        var fakeButton = {};
                        fakeButton.textOp = bindCommand("doAutoindent");
                        doClick(fakeButton);
                    }
                }
            });

            // special handler because IE clears the context of the textbox on ESC
            if (ua.isIE) {
                util.addEvent(inputBox, "keydown", function (key) {
                    if (key.keyCode === 27) {
                        return false;
                    }
                });
            }

            // Perform the button's action.
            function doClick(button) {
                inputBox.focus();

                if (button.textOp) {
                    if (undoManager) {
                        undoManager.setCommandMode();
                    }

                    var state = new TextareaState(panels);

                    if (!state) {
                        return;
                    }

                    var chunks = state.getChunks();

                    // Some commands launch a "modal" prompt dialog.  Javascript
                    // can't really make a modal dialog box and the WMD code
                    // will continue to execute while the dialog is displayed.
                    // This prevents the dialog pattern I'm used to and means
                    // I can't do something like this:
                    //
                    // var link = CreateLinkDialog();
                    // makeMarkdownLink(link);
                    //
                    // Instead of this straightforward method of handling a
                    // dialog I have to pass any code which would execute
                    // after the dialog is dismissed (e.g. link creation)
                    // in a function parameter.
                    //
                    // Yes this is awkward and I think it sucks, but there's
                    // no real workaround.  Only the image and link code
                    // create dialogs and require the function pointers.
                    var fixupInputArea = function () {
                        inputBox.focus();

                        if (chunks) {
                            state.setChunks(chunks);
                        }

                        state.restore();
                        previewManager.refresh();
                    };

                    var noCleanup = button.textOp(chunks, fixupInputArea);

                    if (!noCleanup) {
                        fixupInputArea();
                    }
                }

                if (button.execute) {
                    button.execute(undoManager);
                }
            }

            function setupButton(button, isEnabled)
            {
                if (isEnabled) {
                    button.disabled = false;
                    button.onclick = function () {
                        if (this.onmouseout) {
                            this.onmouseout();
                        }
                        doClick(this);
                        return false;
                    }
                } else {
                    button.disabled = true;
                }
            }

            function bindCommand(method) {
                if (typeof method === "string") {
                    method = commandManager[method];
                }

                return function () {
                    method.apply(commandManager, arguments);
                }
            }

            function makeSpritedButtonRow() {
                var makeToolbar = function () {
                    var buttonRow = $('<div/>', {class : "btn-toolbar"})[0];
                    return panels.buttonBar.appendChild(buttonRow);
                };

                var makePanel = function (panel, toolbar) {
                    var panelObject = document.createElement("div");
                    panelObject.className = "btn-group";
                    toolbar.appendChild(panelObject);
                    return panelObject;
                };

                var makeButton = function (button, panel) {
                    var buttonObject = $('<button/>', { class : "btn btn-default"})[0];

                    var buttonImage = document.createElement("i");
                    buttonImage.className = button.icon;
                    buttonObject.appendChild(buttonImage);
                    buttonObject.title = getString(button.name);

                    if (button.hotkey) {
                        buttonObject.title = buttonObject.title + " — " + (ua.isWin ? 'Ctrl+' + button.hotkey.toUpperCase() : '⌘'  + button.hotkey.toUpperCase());
                    }

                    if (button.action) {
                        buttonObject.textOp = bindCommand(button.action);
                    }

                    if (button.execute) {
                        buttonObject.execute = button.execute;
                    }

                    setupButton(buttonObject, true);

                    panel.appendChild(buttonObject);


                    return buttonObject;

                };


                $.each(settings.toolbars, function (index, toolbar) {
                    var toolbarObject = makeToolbar();
                    $.each(toolbar.panels, function (index, panel) {
                        var panelObject = makePanel(panel, toolbarObject);
                        $.each(panel.buttons, function (index, button) {
                            panelButtons[button.name] = button;
                            buttons[button.name] = makeButton(button, panelObject);
                        });
                    });
                });

                setUndoRedoButtonStates();
            }

            function setUndoRedoButtonStates() {
                if (undoManager) {
                    setupButton(buttons.undo, undoManager.canUndo());
                    setupButton(buttons.redo, undoManager.canRedo());
                }
            }

            this.setUndoRedoButtonStates = setUndoRedoButtonStates;
        }


        function CommandManager(getString, converter) {
            //this.hooks = pluginHooks;
            this.getString = getString;
            this.converter = converter;
        }

        var commandProto = CommandManager.prototype;

        // The markdown symbols - 4 spaces = code, > = blockquote, etc.
        commandProto.prefixes = "(?:\\s{4,}|\\s*>|\\s*-\\s+|\\s*\\d+\\.|=|\\+|-|_|\\*|#|\\s*\\[[^\n]]+\\]:)";

        // Remove markdown symbols from the chunk selection.
        commandProto.unwrap = function (chunk) {
            var txt = new re("([^\\n])\\n(?!(\\n|" + this.prefixes + "))", "g");
            chunk.selection = chunk.selection.replace(txt, "$1 $2");
        };

        commandProto.doUndo = function (chunk, callback) {
            undoManager.setCommandMode();
            undoManager.undo();
        };

        commandProto.wrap = function (chunk, len) {
            this.unwrap(chunk);
            var regex = new re("(.{1," + len + "})( +|$\\n?)", "gm"),
                that = this;

            chunk.selection = chunk.selection.replace(regex, function (line, marked) {
                if (new re("^" + that.prefixes, "").test(line)) {
                    return line;
                }
                return marked + "\n";
            });

            chunk.selection = chunk.selection.replace(/\s+$/, "");
        };

        commandProto.doBold = function (chunk, postProcessing) {
            return this.doBorI(chunk, postProcessing, 2, this.getString("boldexample"));
        };

        commandProto.doItalic = function (chunk, postProcessing) {
            return this.doBorI(chunk, postProcessing, 1, this.getString("italicexample"));
        };

        // chunk: The selected region that will be enclosed with */**
        // nStars: 1 for italics, 2 for bold
        // insertText: If you just click the button without highlighting text, this gets inserted
        commandProto.doBorI = function (chunk, postProcessing, nStars, insertText) {

            // Get rid of whitespace and fixup newlines.
            chunk.trimWhitespace();
            chunk.selection = chunk.selection.replace(/\n{2,}/g, "\n");

            // Look for stars before and after.  Is the chunk already marked up?
            // note that these regex matches cannot fail
            var starsBefore = /(\**$)/.exec(chunk.before)[0];
            var starsAfter = /(^\**)/.exec(chunk.after)[0];

            var prevStars = Math.min(starsBefore.length, starsAfter.length);

            // Remove stars if we have to since the button acts as a toggle.
            if ((prevStars >= nStars) && (prevStars != 2 || nStars != 1)) {
                chunk.before = chunk.before.replace(re("[*]{" + nStars + "}$", ""), "");
                chunk.after = chunk.after.replace(re("^[*]{" + nStars + "}", ""), "");
            } else if (!chunk.selection && starsAfter) {
                // It's not really clear why this code is necessary.  It just moves
                // some arbitrary stuff around.
                chunk.after = chunk.after.replace(/^([*_]*)/, "");
                chunk.before = chunk.before.replace(/(\s?)$/, "");
                var whitespace = re.$1;
                chunk.before = chunk.before + starsAfter + whitespace;
            } else {

                // In most cases, if you don't have any selected text and click the button
                // you'll get a selected, marked up region with the default text inserted.
                if (!chunk.selection && !starsAfter) {
                    chunk.selection = insertText;
                }

                // Add the true markup.
                var markup = nStars <= 1 ? "*" : "**"; // shouldn't the test be = ?
                chunk.before = chunk.before + markup;
                chunk.after = markup + chunk.after;
            }
        };

        commandProto.stripLinkDefs = function (text, defsToAdd) {

            text = text.replace(/^[ ]{0,3}\[(\d+)\]:[ \t]*\n?[ \t]*<?(\S+?)>?[ \t]*\n?[ \t]*(?:(\n*)["(](.+?)[")][ \t]*)?(?:\n+|$)/gm,
                function (totalMatch, id, link, newlines, title) {
                    defsToAdd[id] = totalMatch.replace(/\s*$/, "");
                    if (newlines) {
                        // Strip the title and return that separately.
                        defsToAdd[id] = totalMatch.replace(/["(](.+?)[")]$/, "");
                        return newlines + title;
                    }
                    return "";
                });

            return text;
        };

        commandProto.addLinkDef = function (chunk, linkDef) {

            var refNumber = 0; // The current reference number
            var defsToAdd = {}; //
            // Start with a clean slate by removing all previous link definitions.
            chunk.before = this.stripLinkDefs(chunk.before, defsToAdd);
            chunk.selection = this.stripLinkDefs(chunk.selection, defsToAdd);
            chunk.after = this.stripLinkDefs(chunk.after, defsToAdd);

            var defs = "";
            var regex = /(\[)((?:\[[^\]]*\]|[^\[\]])*)(\][ ]?(?:\n[ ]*)?\[)(\d+)(\])/g;

            // The above regex, used to update [foo][13] references after renumbering,
            // is much too liberal; it can catch things that are not actually parsed
            // as references (notably: code). It's impossible to know which matches are
            // real references without performing a markdown conversion, so that's what
            // we do. All matches are replaced with a unique reference number, which is
            // given a unique link. The uniquifier in both cases is the character offset
            // of the match inside the source string. The modified version is then sent
            // through the Markdown renderer. Because link reference are stripped during
            // rendering, the unique link is present in the rendered version if and only
            // if the match at its offset was in fact rendered as a link or image.
            var complete = chunk.before + chunk.selection + chunk.after;
            var rendered = settings.converter.makeHtml(complete);
            var testlink = "http://this-is-a-real-link.biz/";

            // If our fake link appears in the rendered version *before* we have added it,
            // this probably means you're a Meta Stack Exchange user who is deliberately
            // trying to break this feature. You can still break this workaround if you
            // attach a plugin to the converter that sometimes (!) inserts this link. In
            // that case, consider yourself unsupported.
            while (rendered.indexOf(testlink) != -1) {
                testlink += "nicetry/";
            }

            var fakedefs = "\n\n";

            // the regex is tested on the (up to) three chunks separately, and on substrings,
            // so in order to have the correct offsets to check against okayToModify(), we
            // have to keep track of how many characters are in the original source before
            // the substring that we're looking at. Note that doLinkOrImage aligns the selection
            // on potential brackets, so there should be no major breakage from the chunk
            // separation.
            var skippedChars = 0;

            var uniquified = complete.replace(regex, function uniquify(wholeMatch, before, inner, afterInner, id, end, offset) {
                skippedChars += offset;
                fakedefs += " [" + skippedChars + "]: " + testlink + skippedChars + "/unicorn\n";
                skippedChars += before.length;
                inner = inner.replace(regex, uniquify);
                skippedChars -= before.length;
                var result = before + inner + afterInner + skippedChars + end;
                skippedChars -= offset;
                return result;
            });

            rendered = settings.converter.makeHtml(uniquified + fakedefs);

            var okayToModify = function (offset) {
                return rendered.indexOf(testlink + offset + "/unicorn") !== -1;
            };

            var addDefNumber = function (def) {
                refNumber++;
                def = def.replace(/^[ ]{0,3}\[(\d+)\]:/, "  [" + refNumber + "]:");
                defs += "\n" + def;
            };

            // note that
            // a) the recursive call to getLink cannot go infinite, because by definition
            //    of regex, inner is always a proper substring of wholeMatch, and
            // b) more than one level of nesting is neither supported by the regex
            //    nor making a lot of sense (the only use case for nesting is a linked image)
            var getLink = function (wholeMatch, before, inner, afterInner, id, end, offset) {
                if (!okayToModify(skippedChars + offset))
                    return wholeMatch;
                skippedChars += offset + before.length;
                inner = inner.replace(regex, getLink);
                skippedChars -= offset + before.length;
                if (defsToAdd[id]) {
                    addDefNumber(defsToAdd[id]);
                    return before + inner + afterInner + refNumber + end;
                }
                return wholeMatch;
            };

            var len = chunk.before.length;
            chunk.before = chunk.before.replace(regex, getLink);
            skippedChars += len;

            len = chunk.selection.length;
            if (linkDef) {
                addDefNumber(linkDef);
            }
            else {
                chunk.selection = chunk.selection.replace(regex, getLink);
            }
            skippedChars += len;

            var refOut = refNumber;

            chunk.after = chunk.after.replace(regex, getLink);

            if (chunk.after) {
                chunk.after = chunk.after.replace(/\n*$/, "");
            }
            if (!chunk.after) {
                chunk.selection = chunk.selection.replace(/\n*$/, "");
            }

            chunk.after += "\n\n" + defs;

            return refOut;
        };

        // takes the line as entered into the add link/as image dialog and makes
        // sure the URL and the optinal title are "nice".
        function properlyEncoded(linkdef) {
            return linkdef.replace(/^\s*(.*?)(?:\s+"(.+)")?\s*$/, function (wholematch, link, title) {

                var inQueryString = false;

                // Having `[^\w\d-./]` in there is just a shortcut that lets us skip
                // the most common characters in URLs. Replacing that it with `.` would not change
                // the result, because encodeURI returns those characters unchanged, but it
                // would mean lots of unnecessary replacement calls. Having `[` and `]` in that
                // section as well means we do *not* enocde square brackets. These characters are
                // a strange beast in URLs, but if anything, this causes URLs to be more readable,
                // and we leave it to the browser to make sure that these links are handled without
                // problems.
                link = link.replace(/%(?:[\da-fA-F]{2})|\?|\+|[^-\w\d./[\]]/g, function (match) {
                    // Valid percent encoding. Could just return it as is, but we follow RFC3986
                    // Section 2.1 which says "For consistency, URI producers and normalizers
                    // should use uppercase hexadecimal digits for all percent-encodings."
                    // Note that we also handle (illegal) stand-alone percent characters by
                    // replacing them with "%25"
                    if (match.length === 3 && match.charAt(0) == "%") {
                        return match.toUpperCase();
                    }
                    switch (match) {
                        case "?":
                            inQueryString = true;
                            return "?";
                            break;

                        // In the query string, a plus and a space are identical -- normalize.
                        // Not strictly necessary, but identical behavior to the previous version
                        // of this function.
                        case "+":
                            if (inQueryString)
                                return "%20";
                            break;
                    }
                    return encodeURI(match);
                });

                if (title) {
                    title = title.trim ? title.trim() : title.replace(/^\s*/, "").replace(/\s*$/, "");
                    title = title.replace(/"/g, "quot;").replace(/\(/g, "&#40;").replace(/\)/g, "&#41;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                }

                return title ? link + ' "' + title + '"' : link;
            });
        };

        commandProto.doLink = function (chunk, postProcessing) {
            this.doLinkOrImage(chunk, postProcessing, false);
        };

        commandProto.doImage = function (chunk, postProcessing) {
            this.doLinkOrImage(chunk, postProcessing, true);
        };

        commandProto.doLinkOrImage = function (chunk, postProcessing, isImage) {

            chunk.trimWhitespace();
            chunk.findTags(/\s*!?\[/, /\][ ]?(?:\n[ ]*)?(\[.*?\])?/);
            //var background;

            if (chunk.endTag.length > 1 && chunk.startTag.length > 0) {

                chunk.startTag = chunk.startTag.replace(/!?\[/, "");
                chunk.endTag = "";
                this.addLinkDef(chunk, null);
            } else {

                // We're moving start and end tag back into the selection, since (as we're in the else block) we're not
                // *removing* a link, but *adding* one, so whatever findTags() found is now back to being part of the
                // link text. linkEnteredCallback takes care of escaping any brackets.
                chunk.selection = chunk.startTag + chunk.selection + chunk.endTag;
                chunk.startTag = chunk.endTag = "";

                if (/\n\n/.test(chunk.selection)) {
                    this.addLinkDef(chunk, null);
                    return;
                }
                var that = this;
                // The function to be executed when you enter a link and press OK or Cancel.
                // Marks up the link and adds the ref.
                var linkEnteredCallback = function (link) {

                    //background.parentNode.removeChild(background);

                    if (link !== null) {
                        // (                          $1
                        //     [^\\]                  anything that's not a backslash
                        //     (?:\\\\)*              an even number (this includes zero) of backslashes
                        // )
                        // (?=                        followed by
                        //     [[\]]                  an opening or closing bracket
                        // )
                        //
                        // In other words, a non-escaped bracket. These have to be escaped now to make sure they
                        // don't count as the end of the link or similar.
                        // Note that the actual bracket has to be a lookahead, because (in case of to subsequent brackets),
                        // the bracket in one match may be the "not a backslash" character in the next match, so it
                        // should not be consumed by the first match.
                        // The "prepend a space and finally remove it" steps makes sure there is a "not a backslash" at the
                        // start of the string, so this also works if the selection begins with a bracket. We cannot solve
                        // this by anchoring with ^, because in the case that the selection starts with two brackets, this
                        // would mean a zero-width match at the start. Since zero-width matches advance the string position,
                        // the first bracket could then not act as the "not a backslash" for the second.
                        chunk.selection = (" " + chunk.selection).replace(/([^\\](?:\\\\)*)(?=[[\]])/g, "$1\\").substr(1);

                        var linkDef = " [999]: " + properlyEncoded(link);

                        var num = that.addLinkDef(chunk, linkDef);
                        chunk.startTag = isImage ? "![" : "[";
                        chunk.endTag = "][" + num + "]";

                        if (!chunk.selection) {
                            if (isImage) {
                                chunk.selection = that.getString("imagedescription");
                            }
                            else {
                                chunk.selection = that.getString("linkdescription");
                            }
                        }
                    }
                    postProcessing();
                };

                //background = ui.createBackground();

                if (isImage) {
                    //if (!this.hooks.insertImageDialog(linkEnteredCallback))
                    ui.prompt(this.getString("imagedialog"), imageDefaultText, linkEnteredCallback);
                }
                else {
                    ui.prompt(this.getString("linkdialog"), linkDefaultText, linkEnteredCallback);
                }
                return true;
            }
        };

        // When making a list, hitting shift-enter will put your cursor on the next line
        // at the current indent level.
        commandProto.doAutoindent = function (chunk, postProcessing) {

            var commandMgr = this,
                fakeSelection = false;

            chunk.before = chunk.before.replace(/(\n|^)[ ]{0,3}([*+-]|\d+[.])[ \t]*\n$/, "\n\n");
            chunk.before = chunk.before.replace(/(\n|^)[ ]{0,3}>[ \t]*\n$/, "\n\n");
            chunk.before = chunk.before.replace(/(\n|^)[ \t]+\n$/, "\n\n");

            // There's no selection, end the cursor wasn't at the end of the line:
            // The user wants to split the current list item / code line / blockquote line
            // (for the latter it doesn't really matter) in two. Temporarily select the
            // (rest of the) line to achieve this.
            if (!chunk.selection && !/^[ \t]*(?:\n|$)/.test(chunk.after)) {
                chunk.after = chunk.after.replace(/^[^\n]*/, function (wholeMatch) {
                    chunk.selection = wholeMatch;
                    return "";
                });
                fakeSelection = true;
            }

            if (/(\n|^)[ ]{0,3}([*+-]|\d+[.])[ \t]+.*\n$/.test(chunk.before)) {
                if (commandMgr.doList) {
                    commandMgr.doList(chunk);
                }
            }
            if (/(\n|^)[ ]{0,3}>[ \t]+.*\n$/.test(chunk.before)) {
                if (commandMgr.doBlockquote) {
                    commandMgr.doBlockquote(chunk);
                }
            }
            if (/(\n|^)(\t|[ ]{4,}).*\n$/.test(chunk.before)) {
                if (commandMgr.doCode) {
                    commandMgr.doCode(chunk);
                }
            }

            if (fakeSelection) {
                chunk.after = chunk.selection + chunk.after;
                chunk.selection = "";
            }
        };

        commandProto.doBlockquote = function (chunk, postProcessing) {

            chunk.selection = chunk.selection.replace(/^(\n*)([^\r]+?)(\n*)$/,
                function (totalMatch, newlinesBefore, text, newlinesAfter) {
                    chunk.before += newlinesBefore;
                    chunk.after = newlinesAfter + chunk.after;
                    return text;
                });

            chunk.before = chunk.before.replace(/(>[ \t]*)$/,
                function (totalMatch, blankLine) {
                    chunk.selection = blankLine + chunk.selection;
                    return "";
                });

            chunk.selection = chunk.selection.replace(/^(\s|>)+$/, "");
            chunk.selection = chunk.selection || this.getString("quoteexample");

            // The original code uses a regular expression to find out how much of the
            // text *directly before* the selection already was a blockquote:

            /*
             if (chunk.before) {
             chunk.before = chunk.before.replace(/\n?$/, "\n");
             }
             chunk.before = chunk.before.replace(/(((\n|^)(\n[ \t]*)*>(.+\n)*.*)+(\n[ \t]*)*$)/,
             function (totalMatch) {
             chunk.startTag = totalMatch;
             return "";
             });
             */

            // This comes down to:
            // Go backwards as many lines a possible, such that each line
            //  a) starts with ">", or
            //  b) is almost empty, except for whitespace, or
            //  c) is preceeded by an unbroken chain of non-empty lines
            //     leading up to a line that starts with ">" and at least one more character
            // and in addition
            //  d) at least one line fulfills a)
            //
            // Since this is essentially a backwards-moving regex, it's susceptible to
            // catstrophic backtracking and can cause the browser to hang;
            // see e.g. http://meta.stackexchange.com/questions/9807.
            //
            // Hence we replaced this by a simple state machine that just goes through the
            // lines and checks for a), b), and c).

            var match = "",
                leftOver = "",
                line;
            if (chunk.before) {
                var lines = chunk.before.replace(/\n$/, "").split("\n");
                var inChain = false;
                for (var i = 0; i < lines.length; i++) {
                    var good = false;
                    line = lines[i];
                    inChain = inChain && line.length > 0; // c) any non-empty line continues the chain
                    if (/^>/.test(line)) {                // a)
                        good = true;
                        if (!inChain && line.length > 1)  // c) any line that starts with ">" and has at least one more character starts the chain
                            inChain = true;
                    } else if (/^[ \t]*$/.test(line)) {   // b)
                        good = true;
                    } else {
                        good = inChain;                   // c) the line is not empty and does not start with ">", so it matches if and only if we're in the chain
                    }
                    if (good) {
                        match += line + "\n";
                    } else {
                        leftOver += match + line;
                        match = "\n";
                    }
                }
                if (!/(^|\n)>/.test(match)) {             // d)
                    leftOver += match;
                    match = "";
                }
            }

            chunk.startTag = match;
            chunk.before = leftOver;

            // end of change

            if (chunk.after) {
                chunk.after = chunk.after.replace(/^\n?/, "\n");
            }

            chunk.after = chunk.after.replace(/^(((\n|^)(\n[ \t]*)*>(.+\n)*.*)+(\n[ \t]*)*)/,
                function (totalMatch) {
                    chunk.endTag = totalMatch;
                    return "";
                }
            );

            var replaceBlanksInTags = function (useBracket) {

                var replacement = useBracket ? "> " : "";

                if (chunk.startTag) {
                    chunk.startTag = chunk.startTag.replace(/\n((>|\s)*)\n$/,
                        function (totalMatch, markdown) {
                            return "\n" + markdown.replace(/^[ ]{0,3}>?[ \t]*$/gm, replacement) + "\n";
                        });
                }
                if (chunk.endTag) {
                    chunk.endTag = chunk.endTag.replace(/^\n((>|\s)*)\n/,
                        function (totalMatch, markdown) {
                            return "\n" + markdown.replace(/^[ ]{0,3}>?[ \t]*$/gm, replacement) + "\n";
                        });
                }
            };

            if (/^(?![ ]{0,3}>)/m.test(chunk.selection)) {
                this.wrap(chunk, SETTINGS.lineLength - 2);
                chunk.selection = chunk.selection.replace(/^/gm, "> ");
                replaceBlanksInTags(true);
                chunk.skipLines();
            } else {
                chunk.selection = chunk.selection.replace(/^[ ]{0,3}> ?/gm, "");
                this.unwrap(chunk);
                replaceBlanksInTags(false);

                if (!/^(\n|^)[ ]{0,3}>/.test(chunk.selection) && chunk.startTag) {
                    chunk.startTag = chunk.startTag.replace(/\n{0,2}$/, "\n\n");
                }

                if (!/(\n|^)[ ]{0,3}>.*$/.test(chunk.selection) && chunk.endTag) {
                    chunk.endTag = chunk.endTag.replace(/^\n{0,2}/, "\n\n");
                }
            }

            //chunk.selection = this.hooks.postBlockquoteCreation(chunk.selection);

            if (!/\n/.test(chunk.selection)) {
                chunk.selection = chunk.selection.replace(/^(> *)/,
                    function (wholeMatch, blanks) {
                        chunk.startTag += blanks;
                        return "";
                    });
            }
        };

        commandProto.doCode = function (chunk, postProcessing) {

            var hasTextBefore = /\S[ ]*$/.test(chunk.before);
            var hasTextAfter = /^[ ]*\S/.test(chunk.after);

            // Use 'four space' markdown if the selection is on its own
            // line or is multiline.
            if ((!hasTextAfter && !hasTextBefore) || /\n/.test(chunk.selection)) {

                chunk.before = chunk.before.replace(/[ ]{4}$/,
                    function (totalMatch) {
                        chunk.selection = totalMatch + chunk.selection;
                        return "";
                    });

                var nLinesBack = 1;
                var nLinesForward = 1;

                if (/(\n|^)(\t|[ ]{4,}).*\n$/.test(chunk.before)) {
                    nLinesBack = 0;
                }
                if (/^\n(\t|[ ]{4,})/.test(chunk.after)) {
                    nLinesForward = 0;
                }

                chunk.skipLines(nLinesBack, nLinesForward);

                if (!chunk.selection) {
                    chunk.startTag = "    ";
                    chunk.selection = this.getString("codeexample");
                }
                else {
                    if (/^[ ]{0,3}\S/m.test(chunk.selection)) {
                        if (/\n/.test(chunk.selection))
                            chunk.selection = chunk.selection.replace(/^/gm, "    ");
                        else // if it's not multiline, do not select the four added spaces; this is more consistent with the doList behavior
                            chunk.before += "    ";
                    }
                    else {
                        chunk.selection = chunk.selection.replace(/^(?:[ ]{4}|[ ]{0,3}\t)/gm, "");
                    }
                }
            }
            else {
                // Use backticks (`) to delimit the code block.

                chunk.trimWhitespace();
                chunk.findTags(/`/, /`/);

                if (!chunk.startTag && !chunk.endTag) {
                    chunk.startTag = chunk.endTag = "`";
                    if (!chunk.selection) {
                        chunk.selection = this.getString("codeexample");
                    }
                }
                else if (chunk.endTag && !chunk.startTag) {
                    chunk.before += chunk.endTag;
                    chunk.endTag = "";
                }
                else {
                    chunk.startTag = chunk.endTag = "";
                }
            }
        };

        commandProto.doUlList = function (chunk, postProcessing) {
            return this.doList(chunk, postProcessing, false);
        };

        commandProto.doOlList = function (chunk, postProcessing) {
            return this.doList(chunk, postProcessing, true);
        };

        commandProto.doList = function (chunk, postProcessing, isNumberedList) {

            // These are identical except at the very beginning and end.
            // Should probably use the regex extension function to make this clearer.
            var previousItemsRegex = /(\n|^)(([ ]{0,3}([*+-]|\d+[.])[ \t]+.*)(\n.+|\n{2,}([*+-].*|\d+[.])[ \t]+.*|\n{2,}[ \t]+\S.*)*)\n*$/;
            var nextItemsRegex = /^\n*(([ ]{0,3}([*+-]|\d+[.])[ \t]+.*)(\n.+|\n{2,}([*+-].*|\d+[.])[ \t]+.*|\n{2,}[ \t]+\S.*)*)\n*/;

            // The default bullet is a dash but others are possible.
            // This has nothing to do with the particular HTML bullet,
            // it's just a markdown bullet.
            var bullet = "-";

            // The number in a numbered list.
            var num = 1;

            // Get the item prefix - e.g. " 1. " for a numbered list, " - " for a bulleted list.
            var getItemPrefix = function () {
                var prefix;
                if (isNumberedList) {
                    prefix = " " + num + ". ";
                    num++;
                }
                else {
                    prefix = " " + bullet + " ";
                }
                return prefix;
            };

            // Fixes the prefixes of the other list items.
            var getPrefixedItem = function (itemText) {

                // The numbering flag is unset when called by autoindent.
                if (isNumberedList === undefined) {
                    isNumberedList = /^\s*\d/.test(itemText);
                }

                // Renumber/bullet the list element.
                itemText = itemText.replace(/^[ ]{0,3}([*+-]|\d+[.])\s/gm,
                    function (_) {
                        return getItemPrefix();
                    });

                return itemText;
            };

            chunk.findTags(/(\n|^)*[ ]{0,3}([*+-]|\d+[.])\s+/, null);

            if (chunk.before && !/\n$/.test(chunk.before) && !/^\n/.test(chunk.startTag)) {
                chunk.before += chunk.startTag;
                chunk.startTag = "";
            }

            if (chunk.startTag) {

                var hasDigits = /\d+[.]/.test(chunk.startTag);
                chunk.startTag = "";
                chunk.selection = chunk.selection.replace(/\n[ ]{4}/g, "\n");
                this.unwrap(chunk);
                chunk.skipLines();

                if (hasDigits) {
                    // Have to renumber the bullet points if this is a numbered list.
                    chunk.after = chunk.after.replace(nextItemsRegex, getPrefixedItem);
                }
                if (isNumberedList == hasDigits) {
                    return;
                }
            }

            var nLinesUp = 1;

            chunk.before = chunk.before.replace(previousItemsRegex,
                function (itemText) {
                    if (/^\s*([*+-])/.test(itemText)) {
                        bullet = re.$1;
                    }
                    nLinesUp = /[^\n]\n\n[^\n]/.test(itemText) ? 1 : 0;
                    return getPrefixedItem(itemText);
                });

            if (!chunk.selection) {
                chunk.selection = this.getString("litem");
            }

            var prefix = getItemPrefix();

            var nLinesDown = 1;

            chunk.after = chunk.after.replace(nextItemsRegex,
                function (itemText) {
                    nLinesDown = /[^\n]\n\n[^\n]/.test(itemText) ? 1 : 0;
                    return getPrefixedItem(itemText);
                });

            chunk.trimWhitespace(true);
            chunk.skipLines(nLinesUp, nLinesDown, true);
            chunk.startTag = prefix;
            var spaces = prefix.replace(/./g, " ");
            this.wrap(chunk, SETTINGS.lineLength - spaces.length);
            chunk.selection = chunk.selection.replace(/\n/g, "\n" + spaces);

        };

        commandProto.doHeading = function (chunk, postProcessing) {
            // Remove leading/trailing whitespace and reduce internal spaces to single spaces.
            chunk.selection = chunk.selection.replace(/\s+/g, " ");
            chunk.selection = chunk.selection.replace(/(^\s+|\s+$)/g, "");

            // If we clicked the button with no selected text, we just
            // make a level 2 hash header around some default text.
            if (!chunk.selection) {
                chunk.startTag = "## ";
                chunk.selection = this.getString("headingexample");
                chunk.endTag = " ##";
                return;
            }

            var headerLevel = 0;     // The existing header level of the selected text.

            // Remove any existing hash heading markdown and save the header level.
            chunk.findTags(/#+[ ]*/, /[ ]*#+/);
            if (/#+/.test(chunk.startTag)) {
                headerLevel = re.lastMatch.length;
            }
            chunk.startTag = chunk.endTag = "";

            // Try to get the current header level by looking for - and = in the line
            // below the selection.
            chunk.findTags(null, /\s?(-+|=+)/);
            if (/=+/.test(chunk.endTag)) {
                headerLevel = 1;
            }
            if (/-+/.test(chunk.endTag)) {
                headerLevel = 2;
            }

            // Skip to the next line so we can create the header markdown.
            chunk.startTag = chunk.endTag = "";
            chunk.skipLines(1, 1);

            // We make a level 2 header if there is no current header.
            // If there is a header level, we substract one from the header level.
            // If it's already a level 1 header, it's removed.
            var headerLevelToCreate = headerLevel == 0 ? 2 : headerLevel - 1;

            if (headerLevelToCreate > 0) {

                // The button only creates level 1 and 2 underline headers.
                // Why not have it iterate over hash header levels?  Wouldn't that be easier and cleaner?
                var headerChar = headerLevelToCreate >= 2 ? "-" : "=";
                var len = chunk.selection.length;
                if (len > SETTINGS.lineLength) {
                    len = SETTINGS.lineLength;
                }
                chunk.endTag = "\n";
                while (len--) {
                    chunk.endTag += headerChar;
                }
            }
        };

        commandProto.doHorizontalRule = function (chunk, postProcessing) {
            chunk.startTag = "----------\n";
            chunk.selection = "";
            chunk.skipLines(2, 1, true);
        };

        var editor = new Editor(settings.converter, settings);
        editor.run($(this));

        return this;
    };
}( jQuery ));

//# sourceMappingURL=mdejs.js.map
