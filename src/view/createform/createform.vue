<template>
  <div class="createFormPage">
    <!-- Top bar -->
    <header ref="topbarRef" class="pageTopbar">
      <div class="topLeft">
        <div class="titleRow">
          <i class="fa-solid fa-pen-to-square"></i>
          <h1 class="pageTitle">ສ້າງ Form</h1>
          <span class="pill">Builder</span>
        </div>
        <p class="pageSub">
          ສ້າງແບບຟອມແນວ Google Form • ເພີ່ມຄຳຖາມ • ຕັ້ງ Required • Export JSON
        </p>
      </div>

      <div class="topRight">
        <button class="btn ghost" type="button" @click="togglePreview" ref="btnPreviewRef">
          <i class="fa-solid" :class="isPreview ? 'fa-eye-slash' : 'fa-eye'"></i>
          <span>{{ isPreview ? "Back to Builder" : "Preview" }}</span>
        </button>

   <button class="btn" type="button" @click="saveDraft" ref="btnSaveRef" :disabled="isSaving">
  <i class="fa-solid fa-cloud-arrow-up"></i>
  <span>{{ isSaving ? "Saving..." : "Save" }}</span>
</button>



        <button class="btn ghost" type="button" @click="copyJson" ref="btnCopyRef">
          <i class="fa-solid fa-copy"></i>
          <span>Copy JSON</span>
        </button>

        <button class="btn ghost" type="button" @click="downloadJson" ref="btnDownloadRef">
          <i class="fa-solid fa-file-arrow-down"></i>
          <span>Download</span>
        </button>
      </div>
    </header>

    <div class="layout">
      <!-- Main column -->
      <main class="mainCol">
        <!-- Form meta card -->
        <section ref="metaCardRef" class="card metaCard">
          <div class="metaHeader">
            <div class="metaBadge">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
              <span>Form Setup</span>
            </div>

            <div class="metaActions">
              <button class="miniBtn" type="button" @click="resetAll()" title="Reset">
                <i class="fa-solid fa-arrow-rotate-left"></i>
              </button>
              <button class="miniBtn" type="button" @click="addQuestion('short')" title="Add question">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>

          <div class="metaGrid">
            <div class="field">
              <label class="label">Form title</label>
              <input
                v-model="form.title"
                class="input"
                type="text"
                dir="ltr"
                placeholder="Untitled form"
                @focus="focusPop($event)"
                @blur="blurPop($event)"
              />
            </div>

            <div class="field">
              <label class="label">Description</label>
              <textarea
                v-model="form.description"
                class="textarea"
                dir="ltr"
                rows="3"
                placeholder="Write a short description..."
                @focus="focusPop($event)"
                @blur="blurPop($event)"
              />
            </div>

            <div class="field fieldRow">
              <div class="switchWrap">
                <button class="switch" type="button" :class="{ on: form.collectEmail }" @click="form.collectEmail = !form.collectEmail">
                  <span class="knob"></span>
                </button>
                <div class="switchText">
                  <div class="switchTitle">Collect email</div>
                  <div class="switchSub">Ask user email at top</div>
                </div>
              </div>

              <div class="switchWrap">
                <button class="switch" type="button" :class="{ on: form.allowEditAfterSubmit }" @click="form.allowEditAfterSubmit = !form.allowEditAfterSubmit">
                  <span class="knob"></span>
                </button>
                <div class="switchText">
                  <div class="switchTitle">Edit after submit</div>
                  <div class="switchSub">Allow user to edit response</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Builder / Preview -->
        <section class="questionsWrap">
          <!-- PREVIEW MODE -->
          <div v-if="isPreview" ref="previewRef" class="preview">
            <div class="previewHeader">
              <div class="previewTitle">
                <i class="fa-solid fa-eye"></i>
                <span>Preview</span>
              </div>
              <span class="previewHint">{{ questions.length }} questions</span>
            </div>

            <div class="card previewCard">
              <div class="previewFormTitle">{{ form.title || "Untitled form" }}</div>
              <div class="previewFormDesc">{{ form.description || "No description" }}</div>

              <div v-if="form.collectEmail" class="previewEmail">
                <label class="label">Email</label>
                <input v-model="previewEmail" class="input" placeholder="name@example.com" dir="ltr" />
              </div>
            </div>

            <div class="previewList">
              <div v-for="(q, idx) in questions" :key="q.id" class="card previewQ">
                <div class="previewQTitle">
                  <span class="qNum">{{ idx + 1 }}</span>
                  <span class="qText" v-html="nonEmptyHtml(q.title) ? q.title : 'Untitled question'"></span>
                  <span v-if="q.required" class="req">*</span>
                </div>

                <div v-if="nonEmptyHtml(q.description)" class="previewQDesc" v-html="q.description"></div>

                <!-- Image preview under description (NO CROP) -->
                <div v-if="(q.images || []).length" class="imgPreviewWrap">
                  <div class="imgPreviewHead">
                    <i class="fa-regular fa-image"></i>
                    <span>Images</span>
                  </div>
                  <div class="imgGrid">
                    <div v-for="img in q.images" :key="img.id" class="imgTile">
                      <img :src="img.src" alt="preview" />
                    </div>
                  </div>
                </div>

                <div class="previewControl">
                  <input v-if="q.type === 'short'" v-model="previewAnswer[q.id]" class="input" placeholder="Short answer" dir="ltr" />

                  <textarea v-else-if="q.type === 'long'" v-model="previewAnswer[q.id]" class="textarea" rows="4" placeholder="Long answer..." dir="ltr" />

                  <div v-else-if="q.type === 'option'" class="choiceList">
                    <label v-for="(op, i) in q.options" :key="i" class="choiceRow">
                      <input type="radio" :name="q.id" :value="stripHtml(op)" v-model="previewAnswer[q.id]" />
                      <span v-html="nonEmptyHtml(op) ? op : `Choice ${i + 1}`"></span>
                    </label>
                  </div>

                  <div v-else-if="q.type === 'checkbox'" class="choiceList">
                    <label v-for="(op, i) in q.options" :key="i" class="choiceRow">
                      <input type="checkbox" :value="stripHtml(op)" v-model="previewAnswer[q.id]" />
                      <span v-html="nonEmptyHtml(op) ? op : `Choice ${i + 1}`"></span>
                    </label>
                  </div>

                  <select v-else-if="q.type === 'dropdown'" v-model="previewAnswer[q.id]" class="select" dir="ltr">
                    <option value="" disabled>Select…</option>
                    <option v-for="(op, i) in q.options" :key="i" :value="stripHtml(op)">
                      {{ stripHtml(nonEmptyHtml(op) ? op : `Item ${i + 1}`) }}
                    </option>
                  </select>

                  <!-- upload -->
                  <div v-else-if="q.type === 'upload'" class="previewUpload">
                    <div class="uploadMeta">
                      <div class="filePill">
                        <i class="fa-solid fa-paperclip"></i>
                        <span>Upload</span>
                      </div>
                      <div class="fileHint">
                        {{
                          q.uploadRestrictEnabled
                            ? `Types: ${(q.fileTypes || []).join(", ") || "any"} • Max files: ${q.maxFiles || 1} • Limit: ${q.maxSizeMB || 10} MB`
                            : `No restriction (toggle off)`
                        }}
                      </div>
                    </div>

                    <div class="dropZone" @dragover.prevent @drop.prevent="onUploadDrop($event, q)" @click="triggerUploadPick(q.id)">
                      <i class="fa-solid fa-cloud-arrow-up"></i>
                      <div class="dzText">
                        <div class="dzTitle">Drag & drop file here</div>
                        <div class="dzSub">or click to pick files</div>
                      </div>
                      <input
                        class="hiddenInput"
                        type="file"
                        :accept="uploadAcceptAttr(q)"
                        :multiple="Number(q.maxFiles || 1) > 1"
                        :ref="(el) => setUploadInputRef(q.id, el)"
                        @change="onUploadPick($event, q)"
                      />
                    </div>

                    <div v-if="(q.uploadPreviewFiles || []).length" class="uploadList">
                      <div v-for="f in q.uploadPreviewFiles" :key="f.id" class="uploadItem">
                        <i class="fa-solid fa-file"></i>
                        <div class="uMeta">
                          <div class="uName">{{ f.name }}</div>
                          <div class="uSub">{{ prettyBytes(f.size) }}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- score -->
                  <div v-else-if="q.type === 'score'" class="previewScore">
                    <div class="scoreRow">
                      <button
                        v-for="n in (q.scoreMax || 5)"
                        :key="n"
                        class="scoreBtn"
                        type="button"
                        :title="`Score ${n}`"
                        :class="{ active: previewScoreAnswer[q.id] >= n }"
                        @click="previewScoreAnswer[q.id] = n"
                      >
                        <i class="fa-solid" :class="scoreIconClass(q.scoreIcon)"></i>
                      </button>
                    </div>
                    <div class="scoreHint">
                      {{
                        previewScoreAnswer[q.id]
                          ? `Selected: ${previewScoreAnswer[q.id]}/${q.scoreMax || 5}`
                          : `${q.scoreMax || 5} points`
                      }}
                    </div>
                  </div>

                  <!-- date -->
                  <input
                    v-else-if="q.type === 'date'"
                    class="input inputModern"
                    type="text"
                    dir="ltr"
                    placeholder="Select date"
                    v-flatpickr="{ qid: q.id, model: previewDateAnswer }"
                  />

                  <!-- time -->
                  <input
                    v-else-if="q.type === 'time'"
                    class="input inputModern"
                    type="text"
                    dir="ltr"
                    placeholder="Select time"
                    v-timepickr="{ qid: q.id, model: previewAnswer }"
                  />

                  <!-- table option / checkbox -->
                  <div v-else-if="q.type === 'table_option' || q.type === 'table_checkbox'" class="previewGrid">
                    <div class="gridMeta">
                      <div class="gridPill">
                        <i class="fa-solid fa-table-cells"></i>
                        <span>{{ q.type === 'table_checkbox' ? "Table (Checkbox)" : "Table(Option)" }}</span>
                      </div>
                      <div class="gridHint">
                        {{ q.type === "table_checkbox" ? "Select multiple cells" : "Select one per row" }}
                      </div>
                    </div>

                    <div class="gridTableWrap">
                      <table class="gridTable">
                        <thead>
                          <tr>
                            <th class="gridCorner"></th>
                            <th v-for="(c, ci) in (q.gridCols || [])" :key="ci" v-html="nonEmptyHtml(c) ? c : `Col ${ci + 1}`"></th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(r, ri) in (q.gridRows || [])" :key="ri">
                            <td class="gridRowHead" v-html="nonEmptyHtml(r) ? r : `Row ${ri + 1}`"></td>
                            <td v-for="(c, ci) in (q.gridCols || [])" :key="ci" class="gridCell">
                              <input
                                v-if="q.type === 'table_option'"
                                type="radio"
                                :name="`${q.id}_row_${ri}`"
                                :checked="isTableOptionChecked(q, ri, ci)"
                                @change="setTableOption(q, ri, ci)"
                              />
                              <input
                                v-else
                                type="checkbox"
                                :checked="isTableCheckboxChecked(q, ri, ci)"
                                @change="toggleTableCheckbox(q, ri, ci)"
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div v-else class="hintTiny">Unsupported type</div>
                </div>
              </div>
            </div>

            <div class="previewFooter">
              <button class="btn" type="button" @click="submitPreview" :disabled="isSubmitting">
                <i class="fa-solid fa-paper-plane"></i> Submit (preview)
              </button>

              <button class="btn ghost" type="button" @click="togglePreview">
                <i class="fa-solid fa-arrow-left"></i>
                Back
              </button>
            </div>
          </div>

          <!-- BUILDER MODE -->
          <div v-else ref="builderRef" class="builder">
            <div class="builderHeader">
              <div class="builderTitle">
                <i class="fa-solid fa-question"></i>
                <span>Questions</span>
              </div>
              <div class="builderHint">Required • Duplicate • Delete</div>
            </div>

            <div ref="listRef" class="qList">
              <article v-for="(q, idx) in questions" :key="q.id" class="card qCard" :data-qid="q.id">
                <div class="qTop">
                  <div class="qIndex">
                    <span class="qBadge">{{ idx + 1 }}</span>
                    <span class="qTypePill">{{ typeLabel(q.type) }}</span>
                  </div>

                  <div class="qTools">
                    <button class="miniBtn" type="button" @click="duplicateQuestion(q.id)" title="Duplicate question">
                      <i class="fa-solid fa-clone"></i>
                    </button>
                    <button class="miniBtn danger" type="button" @click="removeQuestion(q.id)" title="Delete question">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>

                <!-- Rich tools -->
                <div class="formatBar" @mousedown.prevent>
                  <button class="fmtBtn" type="button" title="Bold (Title = whole)" @click="fmtSmart('bold')"><b>B</b></button>
                  <button class="fmtBtn" type="button" title="Italic (Title = whole)" @click="fmtSmart('italic')"><i>I</i></button>
                  <button class="fmtBtn" type="button" title="Underline (Title = whole)" @click="fmtSmart('underline')"><u>U</u></button>

                <!-- ✅ แก้เป็น -->
<button class="fmtBtn" type="button" title="Add hyperlink to TITLE" @click="openLinkOverlay(q.id)">
  <i class="fa-solid fa-link"></i>
</button>

<button class="fmtBtn" type="button" title="Insert image (URL or Upload)" @click="openImageOverlay(q.id)">
  <i class="fa-regular fa-image"></i>
</button>

                  <div class="fmtHint" v-if="!activeEditorEl">
                    Click a text field • Drag & drop IMAGE into any field to preview under description
                  </div>
                </div>

                <div class="qGrid">
                  <div class="field">
                    <label class="label">Title</label>

                    <div
                      class="richInput titleRich"
                      :class="{ hasLink: titleHasLink(q.title) }"
                      contenteditable
                      spellcheck="false"
                      dir="ltr"
                      data-placeholder="ຫົວຂໍ້"
                      data-editor="title"
                      :data-qid="q.id"
                      v-rich="[q, 'title']"
                      @focus="onEditorFocus($event)"
                      @blur="onEditorBlur($event)"
                      @dragover.prevent
                      @drop.prevent="onRichDrop($event)"
                    ></div>

                    <div class="hintTiny" v-if="titleHasLink(q.title)">
                      <i class="fa-solid fa-link"></i> This title has hyperlink
                      <button class="tinyBtn linkTiny" type="button" @click="removeTitleLink(q.id)">
                        Remove link
                      </button>
                    </div>
                  </div>

                  <div class="field">
                    <label class="label">Description</label>

                    <div
                      class="richInput"
                      contenteditable
                      spellcheck="false"
                      dir="ltr"
                      data-placeholder="ຄຳອະທິບາຍ"
                      data-editor="description"
                      :data-qid="q.id"
                      v-rich="[q, 'description']"
                      @focus="onEditorFocus($event)"
                      @blur="onEditorBlur($event)"
                      @dragover.prevent
                      @drop.prevent="onRichDrop($event)"
                    ></div>

                    <div v-if="(q.images || []).length" class="imgPreviewWrap">
                      <div class="imgPreviewHead">
                        <i class="fa-regular fa-image"></i>
                        <span>Images</span>
                        <span class="imgHint">Preview under description</span>
                      </div>

                      <div class="imgGrid">
                        <div v-for="img in q.images" :key="img.id" class="imgTile">
                          <img :src="img.src" alt="preview" />
                          <button class="imgRemove" type="button" @click="removeQuestionImage(q.id, img.id)" title="Remove image">
                            <i class="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div class="hintTiny" v-if="q.type === 'short'">Short answer: description is optional.</div>
                    <div class="hintTiny" v-else-if="q.type === 'long'">Long answer: description can be long text.</div>
                  </div>

                  <div class="field fieldRow">
                    <div class="field small">
                      <label class="label">Type</label>
                      <select v-model="q.type" class="select" dir="ltr" @change="onTypeChange(q)">
                        <option value="short">Short answer</option>
                        <option value="long">Long answer</option>
                        <option value="option">Option submit (single choice)</option>
                        <option value="checkbox">Checkbox submit (multi choice)</option>
                        <option value="dropdown">Dropdown submit</option>
                        <option value="upload">Upload file</option>
                        <option value="score">Score</option>
                        <option value="table_option">Table option (one per row)</option>
                        <option value="table_checkbox">Table checkbox (multi)</option>
                        <option value="date">Date</option>
                        <option value="time">Time</option>
                      </select>
                    </div>

                    <div class="switchWrap compact">
                      <button class="switch" type="button" :class="{ on: q.required }" @click="q.required = !q.required">
                        <span class="knob"></span>
                      </button>
                      <div class="switchText">
                        <div class="switchTitle">Required</div>
                        <div class="switchSub">must answer</div>
                      </div>
                    </div>
                  </div>

                  <!-- Options editor -->
                  <div v-if="needsOptions(q.type)" class="options">
                    <div class="optionsHead">
                      <div class="optionsTitle">
                        <i class="fa-solid fa-list"></i>
                        <span>Items</span>
                      </div>
                      <button class="miniBtn" type="button" @click="addOption(q)" title="Add item">
                        <i class="fa-solid fa-plus"></i>
                      </button>
                    </div>

                    <div class="optionsList">
                      <div v-for="(op, i) in q.options" :key="i" class="optionRow">
                        <span class="optionIcon">
                          <i v-if="q.type === 'option'" class="fa-regular fa-circle"></i>
                          <i v-else-if="q.type === 'checkbox'" class="fa-regular fa-square"></i>
                          <i v-else class="fa-solid fa-caret-down"></i>
                        </span>

                        <div
                          class="richInput optionInput"
                          contenteditable
                          spellcheck="false"
                          dir="ltr"
                          :data-placeholder="`Item ${i + 1}`"
                          data-editor="option"
                          :data-qid="q.id"
                          :data-idx="i"
                          v-rich="[q.options, i]"
                          @focus="onEditorFocus($event)"
                          @blur="onEditorBlur($event)"
                          @dragover.prevent
                          @drop.prevent="onRichDrop($event)"
                        ></div>

                        <button class="miniBtn" type="button" @click="duplicateOption(q, i)" title="Duplicate item">
                          <i class="fa-solid fa-clone"></i>
                        </button>

                        <button class="miniBtn danger" type="button" @click="removeOption(q, i)" title="Delete item">
                          <i class="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    </div>

                    <div class="optionsFoot">
                      <button class="tinyBtn" type="button" @click="normalizeOptions(q)">
                        <i class="fa-solid fa-wand-magic-sparkles"></i>
                        Clean empty items
                      </button>
                    </div>
                  </div>

                  <!-- Upload -->
                  <div v-else-if="q.type === 'upload'" class="options">
                    <div class="optionsHead">
                      <div class="optionsTitle">
                        <i class="fa-solid fa-paperclip"></i>
                        <span>Upload file</span>
                      </div>
                    </div>

                    <div class="dropZone" @dragover.prevent @drop.prevent="onUploadDrop($event, q)" @click="triggerUploadPick(q.id)">
                      <i class="fa-solid fa-cloud-arrow-up"></i>
                      <div class="dzText">
                        <div class="dzTitle">Drag & drop file here</div>
                        <div class="dzSub">or click to pick files</div>
                      </div>
                      <input
                        class="hiddenInput"
                        type="file"
                        :accept="uploadAcceptAttr(q)"
                        :multiple="Number(q.maxFiles || 1) > 1"
                        :ref="(el) => setUploadInputRef(q.id, el)"
                        @change="onUploadPick($event, q)"
                      />
                    </div>

                    <div v-if="(q.uploadPreviewFiles || []).length" class="uploadList">
                      <div v-for="f in q.uploadPreviewFiles" :key="f.id" class="uploadItem">
                        <i class="fa-solid fa-file"></i>
                        <div class="uMeta">
                          <div class="uName">{{ f.name }}</div>
                          <div class="uSub">{{ prettyBytes(f.size) }}</div>
                        </div>
                        <button class="miniBtn danger" type="button" @click="removeUploadPreviewFile(q, f.id)" title="Remove">
                          <i class="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    </div>

                    <div class="switchWrap" style="margin-top: 10px;">
                      <button class="switch" type="button" :class="{ on: q.uploadRestrictEnabled }" @click="q.uploadRestrictEnabled = !q.uploadRestrictEnabled">
                        <span class="knob"></span>
                      </button>
                      <div class="switchText">
                        <div class="switchTitle">Enable upload conditions</div>
                        <div class="switchSub">Default OFF • Turn ON to limit types/quantity/size</div>
                      </div>
                    </div>

                    <div v-if="q.uploadRestrictEnabled" class="fileSettings">
                      <div class="field">
                        <label class="label">Allowed file types</label>

                        <div class="fileTypePicker">
                          <button class="btn ghost smallBtn" type="button" @click="toggleFileTypeMenu(q.id)">
                            <i class="fa-solid fa-filter"></i>
                            <span>Choose types</span>
                          </button>

                          <div class="chipRow">
                            <span v-for="t in (q.fileTypes || [])" :key="t" class="chip" @click="toggleFileType(q, t)" title="Click to remove">
                              {{ t }}
                              <i class="fa-solid fa-xmark"></i>
                            </span>
                            <span v-if="!(q.fileTypes || []).length" class="chip ghost">any</span>
                          </div>

                          <div v-if="openFileTypeFor === q.id" class="fileTypeMenu">
                            <label v-for="t in FILE_TYPES" :key="t.key" class="fileTypeRow">
                              <input type="checkbox" :checked="(q.fileTypes || []).includes(t.key)" @change="toggleFileType(q, t.key)" />
                              <span>{{ t.key }}</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div class="fieldRow">
                        <div class="field">
                          <label class="label">Quantity (max files)</label>
                          <select v-model.number="q.maxFiles" class="select" dir="ltr">
                            <option v-for="n in [1, 5, 10]" :key="n" :value="n">{{ n }}</option>
                          </select>
                        </div>

                        <div class="field">
                          <label class="label">Limit size (MB)</label>
                          <select v-model.number="q.maxSizeMB" class="select" dir="ltr">
                            <option v-for="n in [1, 10, 100]" :key="n" :value="n">{{ n }} MB</option>
                          </select>
                          <div class="hintTiny">Default: 10 MB</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Score -->
                  <div v-else-if="q.type === 'score'" class="options">
                    <div class="optionsHead">
                      <div class="optionsTitle">
                        <i class="fa-solid fa-ranking-star"></i>
                        <span>Score</span>
                      </div>
                    </div>

                    <div class="fieldRow">
                      <div class="field">
                        <label class="label">Max score</label>
                        <select v-model.number="q.scoreMax" class="select" dir="ltr">
                          <option v-for="n in [1,2,3,4,5,6,7,8,9,10]" :key="n" :value="n">{{ n }}</option>
                        </select>
                      </div>

                      <div class="field">
                        <label class="label">Icon</label>
                        <select v-model="q.scoreIcon" class="select" dir="ltr">
                          <option value="star">star</option>
                          <option value="heart">heart</option>
                          <option value="like">like</option>
                        </select>
                      </div>
                    </div>

                    <div class="scorePreviewRow">
                      <button v-for="n in (q.scoreMax || 5)" :key="n" class="scoreBtn" type="button">
                        <i class="fa-solid" :class="scoreIconClass(q.scoreIcon)"></i>
                      </button>
                    </div>

                    <div class="hintTiny">Preview mode: you can click to select score.</div>
                  </div>

                  <!-- Table -->
                  <div v-else-if="q.type === 'table_option' || q.type === 'table_checkbox'" class="options">
                    <div class="optionsHead">
                      <div class="optionsTitle">
                        <i class="fa-solid fa-table-cells"></i>
                        <span>{{ q.type === "table_checkbox" ? "Table checkbox" : "Table option" }}</span>
                      </div>
                      <button class="tinyBtn" type="button" @click="normalizeGrid(q)">
                        <i class="fa-solid fa-wand-magic-sparkles"></i>
                        Clean empty rows/cols
                      </button>
                    </div>

                    <div class="gridEditor">
                      <div class="gridCol">
                        <div class="optionsHead tight">
                          <div class="optionsTitle">
                            <i class="fa-solid fa-list"></i>
                            <span>Rows</span>
                          </div>
                          <button class="miniBtn" type="button" @click="addGridRow(q)" title="Add row">
                            <i class="fa-solid fa-plus"></i>
                          </button>
                        </div>

                        <div class="optionsList">
                          <div v-for="(r, i) in (q.gridRows || [])" :key="i" class="optionRow optionRowTight">
                            <span class="optionIcon"><i class="fa-solid fa-grip-lines"></i></span>

                            <div
                              class="richInput optionInput"
                              contenteditable
                              spellcheck="false"
                              dir="ltr"
                              :data-placeholder="`Row ${i + 1}`"
                              data-editor="gridRow"
                              :data-qid="q.id"
                              :data-idx="i"
                              v-rich="[q.gridRows, i]"
                              @focus="onEditorFocus($event)"
                              @blur="onEditorBlur($event)"
                              @dragover.prevent
                              @drop.prevent="onRichDrop($event)"
                            ></div>

                            <button class="miniBtn danger" type="button" @click="removeGridRow(q, i)" title="Remove row">
                              <i class="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div class="gridCol">
                        <div class="optionsHead tight">
                          <div class="optionsTitle">
                            <i class="fa-solid fa-list"></i>
                            <span>Columns</span>
                          </div>
                          <button class="miniBtn" type="button" @click="addGridCol(q)" title="Add column">
                            <i class="fa-solid fa-plus"></i>
                          </button>
                        </div>

                        <div class="optionsList">
                          <div v-for="(c, i) in (q.gridCols || [])" :key="i" class="optionRow optionRowTight">
                            <span class="optionIcon"><i class="fa-solid fa-grip-lines-vertical"></i></span>

                            <div
                              class="richInput optionInput"
                              contenteditable
                              spellcheck="false"
                              dir="ltr"
                              :data-placeholder="`Col ${i + 1}`"
                              data-editor="gridCol"
                              :data-qid="q.id"
                              :data-idx="i"
                              v-rich="[q.gridCols, i]"
                              @focus="onEditorFocus($event)"
                              @blur="onEditorBlur($event)"
                              @dragover.prevent
                              @drop.prevent="onRichDrop($event)"
                            ></div>

                            <button class="miniBtn danger" type="button" @click="removeGridCol(q, i)" title="Remove column">
                              <i class="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="hintTiny">
                      {{ q.type === "table_checkbox" ? "Checkbox table: user can select many cells." : "Option table: user selects one per row." }}
                    </div>
                  </div>

                  <div v-else-if="q.type === 'date'" class="hintTiny">Date picker (date only)</div>
                  <div v-else-if="q.type === 'time'" class="hintTiny">Time picker</div>
                </div>
              </article>
            </div>

            <div class="bottomAdd">
              <button class="btn" type="button" @click="addQuestion('short')" ref="btnAddRef">
                <i class="fa-solid fa-plus"></i>
                Add question
              </button>

              <button class="btn ghost" type="button" @click="togglePreview">
                <i class="fa-solid fa-eye"></i>
                Preview
              </button>
            </div>
          </div>
        </section>
      </main>

      <!-- Right toolbar (builder only) -->
      <aside v-if="!isPreview" ref="sideToolsRef" class="sideTools">
        <div class="toolCard">
          <div class="toolTitle">
            <i class="fa-solid fa-bolt"></i>
            Quick add
          </div>

          <button class="toolBtn" type="button" @click="addQuestion('short')">
            <i class="fa-solid fa-i-cursor"></i>
            <span>Short answer</span>
          </button>
          <button class="toolBtn" type="button" @click="addQuestion('long')">
            <i class="fa-solid fa-align-left"></i>
            <span>Long answer</span>
          </button>
          <button class="toolBtn" type="button" @click="addQuestion('option')">
            <i class="fa-solid fa-list-ul"></i>
            <span>Option submit</span>
          </button>
          <button class="toolBtn" type="button" @click="addQuestion('checkbox')">
            <i class="fa-regular fa-square-check"></i>
            <span>Checkbox submit</span>
          </button>
          <button class="toolBtn" type="button" @click="addQuestion('dropdown')">
            <i class="fa-solid fa-caret-down"></i>
            <span>Dropdown submit</span>
          </button>

          <div class="toolDivider"></div>

          <button class="toolBtn" type="button" @click="addQuestion('upload')">
            <i class="fa-solid fa-paperclip"></i>
            <span>Upload file</span>
          </button>
          <button class="toolBtn" type="button" @click="addQuestion('score')">
            <i class="fa-solid fa-ranking-star"></i>
            <span>Score</span>
          </button>
          <button class="toolBtn" type="button" @click="addQuestion('table_option')">
            <i class="fa-solid fa-table-cells"></i>
            <span>Table option</span>
          </button>
          <button class="toolBtn" type="button" @click="addQuestion('table_checkbox')">
            <i class="fa-solid fa-table-cells"></i>
            <span>Table checkbox</span>
          </button>
          <button class="toolBtn" type="button" @click="addQuestion('date')">
            <i class="fa-solid fa-calendar-day"></i>
            <span>Date</span>
          </button>
          <button class="toolBtn" type="button" @click="addQuestion('time')">
            <i class="fa-solid fa-clock"></i>
            <span>Time</span>
          </button>
        </div>

        <div class="toolCard">
          <div class="toolTitle">
            <i class="fa-solid fa-code"></i>
            Output
          </div>

          <div class="jsonBox">
            <div class="jsonHead">
              <span class="jsonTitle">Form JSON</span>
              <span class="jsonMeta">{{ prettyBytes(jsonText.length) }}</span>
            </div>
            <pre class="jsonPre">{{ jsonText }}</pre>
          </div>

          <div class="hintTiny" style="margin-top: 10px;">
            Note: rich text stores HTML. If you render responses on server, sanitize HTML for safety.
          </div>
        </div>
      </aside>
    </div>

    <!-- Overlay (Link / Image) -->
    <div v-if="overlay.show" class="overlay" @mousedown.self="closeOverlay" ref="overlayRef">
      <div class="overlayCard" ref="overlayCardRef">
        <div class="overlayTop">
          <div class="overlayTitle">
            <i class="fa-solid" :class="overlay.mode === 'link' ? 'fa-link' : 'fa-image'"></i>
            <span>{{ overlay.mode === "link" ? "Add Hyperlink to Title" : "Insert Image (URL or Upload)" }}</span>
          </div>
          <button class="miniBtn danger" type="button" @click="closeOverlay" title="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="overlayBody">
          <div class="field">
            <label class="label">{{ overlay.mode === "link" ? "URL" : "Image URL" }}</label>
            <input
              v-model="overlay.url"
              class="input overlayInput"
              type="url"
              dir="ltr"
              placeholder="https://example.com"
              @keydown.enter.prevent="applyOverlay"
            />
            <div class="hintTiny">
              {{
                overlay.mode === "link"
                  ? "This will NOT show the URL text. It will link the title."
                  : "Use URL or upload from computer. Image will be previewed below description (no URL shown)."
              }}
            </div>
          </div>

          <div v-if="overlay.mode === 'image'" class="field">
            <label class="label">Upload image</label>
            <div class="overlayUploadRow">
              <button class="btn ghost smallBtn" type="button" @click="triggerOverlayImagePick">
                <i class="fa-solid fa-upload"></i>
                <span>Choose image(s)</span>
              </button>
              <div class="hintTiny" style="margin: 0;">
                PNG/JPG/WebP • can select multiple
              </div>
            </div>

            <input ref="overlayImageInputRef" type="file" class="hiddenInput" accept="image/*" multiple @change="onOverlayImagePick" />
          </div>

          <div v-if="overlay.mode === 'image' && overlay.url" class="overlayPreview">
            <div class="overlayPreviewHead">
              <i class="fa-regular fa-image"></i>
              <span>Preview (URL)</span>
            </div>
            <div class="overlayImgBox">
              <img :src="overlay.url" alt="preview" @error="overlayImgError = true" @load="overlayImgError = false" />
              <div v-if="overlayImgError" class="imgErr">
                Image load failed (check URL)
              </div>
            </div>
          </div>

          <div class="overlayActions">
            <button class="btn ghost" type="button" @click="closeOverlay">
              <i class="fa-solid fa-arrow-left"></i>
              Cancel
            </button>

            <button v-if="overlay.mode === 'link'" class="btn ghost dangerBtn" type="button" @click="removeActiveTitleLink">
              <i class="fa-solid fa-link-slash"></i>
              Remove link
            </button>

            <button class="btn" type="button" @click="applyOverlay" :disabled="!overlay.url || (overlay.mode === 'image' && overlayImgError)">
              <i class="fa-solid fa-check"></i>
              Apply URL
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Save success alert -->
    <div v-if="saveAlert.show" class="overlay" @mousedown.self="closeSaveAlert">
      <div class="overlayCard alertCard">
        <div class="overlayTop">
          <div class="overlayTitle">
            <i class="fa-solid fa-circle-check"></i>
            <span>Saved successfully</span>
          </div>
          <button class="miniBtn danger" type="button" @click="closeSaveAlert" title="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="overlayBody">
          <div class="alertText">Your form has been saved.</div>
          <div v-if="saveAlert.id" class="alertMeta">
            Form ID: <b>{{ saveAlert.id }}</b>
          </div>

          <div class="overlayActions">
            <button class="btn" type="button" @click="goViewTemplates">
              <i class="fa-solid fa-eye"></i>
              View
            </button>

            <button class="btn ghost" type="button" @click="closeSaveAlert">
              <i class="fa-solid fa-xmark"></i>
              Close
            </button>
          </div>

          <div class="hintTiny" style="margin-top: 2px;">
            View will redirect to <b>/formtemplete</b> (change path if your route is different).
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div ref="toastRef" class="toast" :class="{ show: toast.show, danger: toast.type === 'danger' }" aria-live="polite">
      <i class="fa-solid" :class="toast.type === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-check'"></i>
      <span>{{ toast.text }}</span>
    </div>
  </div>
</template>


<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import gsap from "gsap";
import flatpickr from "flatpickr";

/**
 * ==========================
 * Router / Config
 * ==========================
 */
const router = useRouter();
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const TEMPLATE_API = `${API_BASE}/api/form-templates`;

/**
 * ✅ DRAFT KEY (เดิมคุณใช้ไว้โหลดค่าเก่า)
 *    ตอนนี้เราจะ "ไม่โหลด" และ "ลบทิ้งเมื่อเข้าหน้า"
 */
const DRAFT_KEY = "lapnet_create_form_draft";

/**
 * ==========================
 * State refs (UI)
 * ==========================
 */
const topbarRef = ref(null);
const metaCardRef = ref(null);
const builderRef = ref(null);
const previewRef = ref(null);
const listRef = ref(null);
const sideToolsRef = ref(null);

const btnPreviewRef = ref(null);
const btnSaveRef = ref(null);
const btnCopyRef = ref(null);
const btnDownloadRef = ref(null);
const btnAddRef = ref(null);

const toastRef = ref(null);
const overlayRef = ref(null);
const overlayCardRef = ref(null);

/**
 * ==========================
 * Toast
 * ==========================
 */
const toast = reactive({ show: false, text: "", type: "ok" });
let toastTimer = null;

function showToast(text, type = "ok") {
  toast.text = String(text || "");
  toast.type = type;
  toast.show = true;

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.show = false), 2200);

  if (toastRef.value) {
    gsap.killTweensOf(toastRef.value);
    gsap.fromTo(toastRef.value, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.22, ease: "power2.out" });
  }
}

/**
 * ==========================
 * Helpers
 * ==========================
 */
const uid = () => `q_${Math.random().toString(16).slice(2)}_${Date.now()}`;
function stripHtml(html) {
  const s = String(html ?? "");
  return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
function nonEmptyHtml(html) {
  return stripHtml(html).length > 0;
}
function prettyBytes(n) {
  const num = Number(n || 0);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}
function cloneJsonSafe(obj) {
  try {
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj));
  }
}
function toPlainJson(obj) {
  // ✅ กัน Vue reactive/proxy + ให้เป็น JSON ล้วน ๆ ก่อนส่งเข้า backend
  return JSON.parse(JSON.stringify(obj));
}
function needsOptions(type) {
  return type === "option" || type === "checkbox" || type === "dropdown";
}
function scoreIconClass(icon) {
  if (icon === "heart") return "fa-heart";
  if (icon === "like") return "fa-thumbs-up";
  return "fa-star";
}
function typeLabel(type) {
  switch (type) {
    case "short": return "Short";
    case "long": return "Long";
    case "option": return "Option";
    case "checkbox": return "Checkbox";
    case "dropdown": return "Dropdown";
    case "upload": return "Upload";
    case "score": return "Score";
    case "table_option": return "Table option";
    case "table_checkbox": return "Table checkbox";
    case "date": return "Date";
    case "time": return "Time";
    default: return type;
  }
}
function focusPop() {}
function blurPop() {}

/**
 * ==========================
 * Active editor tracking + formatting
 * ==========================
 */
const activeEditorEl = ref(null);
const activeEditorMeta = reactive({ qid: null, editor: null, idx: null });

function onEditorFocus(e) {
  activeEditorEl.value = e.target;
  const ds = e.target?.dataset || {};
  activeEditorMeta.qid = ds.qid || null;
  activeEditorMeta.editor = ds.editor || null;
  activeEditorMeta.idx = ds.idx != null ? Number(ds.idx) : null;
}
function onEditorBlur() {
  activeEditorEl.value = null;
}
function fmtSmart(cmd) {
  if (!activeEditorEl.value) {
    showToast("Click a text field first", "danger");
    return;
  }
  try {
    document.execCommand(cmd);
  } catch {
    const el = activeEditorEl.value;
    const html = el.innerHTML || "";
    if (cmd === "bold") el.innerHTML = `<b>${html}</b>`;
    if (cmd === "italic") el.innerHTML = `<i>${html}</i>`;
    if (cmd === "underline") el.innerHTML = `<u>${html}</u>`;
    el.dispatchEvent(new Event("input"));
  }
}

/**
 * ==========================
 * Overlay (link/image) ✅ FIX: lock target qid
 * ==========================
 */
const overlay = reactive({
  show: false,
  mode: "link",      // link|image
  url: "",
  targetQid: null,   // ✅ จำว่า overlay นี้ apply ให้คำถามไหน
});
const overlayImgError = ref(false);
const overlayImageInputRef = ref(null);

function closeOverlay() {
  overlay.show = false;
  overlay.url = "";
  overlay.targetQid = null;
  overlayImgError.value = false;
}

function openLinkOverlay(qidFromBtn = null) {
  // ✅ จากปุ่มในการ์ด -> ส่ง q.id มา
  const qid = qidFromBtn || activeEditorMeta.qid;
  if (!qid) {
    showToast("Select a question first", "danger");
    return;
  }
  overlay.mode = "link";
  overlay.targetQid = qid;
  overlay.url = currentTitleLink(qid) || "";
  overlay.show = true;
}

function openImageOverlay(qidFromBtn = null) {
  const qid = qidFromBtn || activeEditorMeta.qid;
  if (!qid) {
    showToast("Select a question first", "danger");
    return;
  }
  overlay.mode = "image";
  overlay.targetQid = qid;
  overlay.url = "";
  overlay.show = true;
}

function titleHasLink(html) {
  return /<a\b/i.test(String(html || ""));
}
function currentTitleLink(qid) {
  const q = questions.value.find((x) => x.id === qid);
  if (!q) return "";
  const m = String(q.title || "").match(/<a\b[^>]*href=["']([^"']+)["']/i);
  return m?.[1] || "";
}
function stripAnchorKeepText(html) {
  const s = String(html || "");
  return s.replace(/<a\b[^>]*>/gi, "").replace(/<\/a>/gi, "");
}
function removeTitleLink(qid) {
  const q = questions.value.find((x) => x.id === qid);
  if (!q) return;
  q.title = stripAnchorKeepText(q.title);
  showToast("Removed link");
}
function removeActiveTitleLink() {
  const qid = overlay.targetQid || activeEditorMeta.qid;
  if (!qid) return;
  removeTitleLink(qid);
  closeOverlay();
}

function escapeHtmlText(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeHtmlAttr(s) {
  return escapeHtmlText(s);
}

function applyOverlay() {
  const qid = overlay.targetQid || activeEditorMeta.qid;
  if (!qid) {
    showToast("Select a question first", "danger");
    return;
  }

  const url = String(overlay.url || "").trim();
  if (!url) return;

  const q = questions.value.find((x) => x.id === qid);
  if (!q) return;

  // ✅ กันกรณี q.images ไม่ใช่ array
  q.images = Array.isArray(q.images) ? q.images : [];

  if (overlay.mode === "link") {
    const text = stripHtml(q.title) || "Link";
    q.title = `<a href="${escapeHtmlAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtmlText(text)}</a>`;
    showToast("Link applied");
    closeOverlay();
    return;
  }

  if (overlay.mode === "image") {
    q.images.push({ id: uid(), src: url, kind: "url" });
    showToast("Image added");
    closeOverlay();
  }
}

function triggerOverlayImagePick() {
  overlayImageInputRef.value?.click?.();
}

async function onOverlayImagePick(e) {
  const files = Array.from(e?.target?.files || []);
  e.target.value = "";
  if (!files.length) return;

  const qid = overlay.targetQid || activeEditorMeta.qid;
  if (!qid) {
    showToast("Select a question first", "danger");
    return;
  }

  const q = questions.value.find((x) => x.id === qid);
  if (!q) return;

  q.images = Array.isArray(q.images) ? q.images : [];

  for (const f of files) {
    if (!f.type.startsWith("image/")) continue;
    const dataUrl = await readFileAsDataURL(f);
    q.images.push({ id: uid(), src: dataUrl, kind: "upload" });
  }

  showToast("Uploaded image(s)");
  closeOverlay();
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/**
 * drag-drop image into any rich field -> attach to q.images
 */
async function onRichDrop(e) {
  const ds = e.target?.dataset || {};
  const qid = ds.qid || activeEditorMeta.qid;
  if (!qid) return;

  const q = questions.value.find((x) => x.id === qid);
  if (!q) return;

  // ✅ กันกรณี q.images ไม่ใช่ array
  q.images = Array.isArray(q.images) ? q.images : [];

  const files = Array.from(e.dataTransfer?.files || []);
  if (files.length) {
    for (const f of files) {
      if (!f.type.startsWith("image/")) continue;
      const dataUrl = await readFileAsDataURL(f);
      q.images.push({ id: uid(), src: dataUrl, kind: "drop" });
    }
    showToast("Image dropped");
    return;
  }

  const txt = (e.dataTransfer?.getData("text/plain") || "").trim();
  if (txt && isLikelyImageUrl(txt)) {
    q.images.push({ id: uid(), src: txt, kind: "url" });
    showToast("Image URL added");
  }
}
function isLikelyImageUrl(url) {
  return /^https?:\/\/.+\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(url);
}
function removeQuestionImage(qid, imgId) {
  const q = questions.value.find((x) => x.id === qid);
  if (!q) return;
  q.images = (q.images || []).filter((x) => x.id !== imgId);
}

/**
 * ==========================
 * Directives: v-rich / v-flatpickr / v-timepickr
 * ==========================
 */
const vRich = {
  mounted(el, binding) {
    const [target, key] = binding.value || [];
    if (!target) return;

    el.innerHTML = (target?.[key] ?? "") + "";

    const onInput = () => {
      try {
        target[key] = el.innerHTML;
      } catch {}
    };

    el.__rich_onInput = onInput;
    el.addEventListener("input", onInput);

    const onPaste = (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData("text/plain");
      document.execCommand("insertText", false, text);
    };
    el.__rich_onPaste = onPaste;
    el.addEventListener("paste", onPaste);
  },
  updated(el, binding) {
    const [target, key] = binding.value || [];
    if (!target) return;
    const v = (target?.[key] ?? "") + "";
    if (el.innerHTML !== v) el.innerHTML = v;
  },
  beforeUnmount(el) {
    if (el.__rich_onInput) el.removeEventListener("input", el.__rich_onInput);
    if (el.__rich_onPaste) el.removeEventListener("paste", el.__rich_onPaste);
  },
};

const fpInstances = new Map();

const vFlatpickr = {
  mounted(el, binding) {
    const { qid, model } = binding.value || {};
    if (!qid || !model) return;
    const inst = flatpickr(el, {
      dateFormat: "Y-m-d",
      allowInput: true,
      onChange: (dates, str) => {
        model[qid] = str;
      },
    });
    fpInstances.set(el, inst);
  },
  beforeUnmount(el) {
    const inst = fpInstances.get(el);
    if (inst) inst.destroy();
    fpInstances.delete(el);
  },
};

const vTimepickr = {
  mounted(el, binding) {
    const { qid, model } = binding.value || {};
    if (!qid || !model) return;
    const inst = flatpickr(el, {
      enableTime: true,
      noCalendar: true,
      time_24hr: true,
      dateFormat: "H:i",
      allowInput: true,
      onChange: (dates, str) => {
        model[qid] = str;
      },
    });
    fpInstances.set(el, inst);
  },
  beforeUnmount(el) {
    const inst = fpInstances.get(el);
    if (inst) inst.destroy();
    fpInstances.delete(el);
  },
};

/**
 * ==========================
 * Form State
 * ==========================
 */
const form = reactive({
  title: "",
  description: "",
  collectEmail: true,
  allowEditAfterSubmit: false,
});

function makeQuestion(type = "short") {
  const base = {
    id: uid(),
    type,
    title: "",
    description: "",
    required: false,
    images: [],
    options: [],
    uploadRestrictEnabled: false,
    fileTypes: [],
    maxSizeMB: 10,
    maxFiles: 1,
    uploadPreviewFiles: [],
    scoreMax: 5,
    scoreIcon: "star",
    gridRows: [],
    gridCols: [],
    sort_order: 1,
  };

  if (type === "option" || type === "checkbox" || type === "dropdown") base.options = ["Choice 1", "Choice 2"];
  if (type === "upload") {
    base.fileTypes = ["image", "pdf"];
    base.maxSizeMB = 10;
    base.maxFiles = 1;
  }
  if (type === "score") {
    base.scoreMax = 5;
    base.scoreIcon = "star";
  }
  if (type === "table_option" || type === "table_checkbox") {
    base.gridRows = ["Row 1", "Row 2"];
    base.gridCols = ["Col 1", "Col 2", "Col 3"];
  }

  return base;
}

const questions = ref([makeQuestion("short")]);
const isPreview = ref(false);

/**
 * ==========================
 * Question operations
 * ==========================
 */
function addQuestion(type = "short") {
  const q = makeQuestion(type);
  questions.value.push(q);
  questions.value.forEach((x, i) => (x.sort_order = i + 1));
  showToast("Added");
  nextTick(() => {
    if (listRef.value) {
      const cards = listRef.value.querySelectorAll(".qCard");
      const last = cards[cards.length - 1];
      last?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  });
}
function removeQuestion(qid) {
  if (questions.value.length <= 1) {
    showToast("At least 1 question", "danger");
    return;
  }
  questions.value = questions.value.filter((q) => q.id !== qid);
  questions.value.forEach((x, i) => (x.sort_order = i + 1));
}
function duplicateQuestion(qid) {
  const idx = questions.value.findIndex((q) => q.id === qid);
  if (idx < 0) return;
  const copy = cloneJsonSafe(questions.value[idx]);
  copy.id = uid();
  copy.images = (copy.images || []).map((im) => ({ ...im, id: uid() }));
  questions.value.splice(idx + 1, 0, copy);
  questions.value.forEach((x, i) => (x.sort_order = i + 1));
  showToast("Duplicated");
}
function onTypeChange(q) {
  const type = q.type;
  if (needsOptions(type) && (!Array.isArray(q.options) || !q.options.length)) q.options = ["Choice 1", "Choice 2"];
  if (type === "upload") {
    q.uploadRestrictEnabled = !!q.uploadRestrictEnabled;
    q.fileTypes = Array.isArray(q.fileTypes) && q.fileTypes.length ? q.fileTypes : ["image", "pdf"];
    q.maxSizeMB = Number(q.maxSizeMB || 10);
    q.maxFiles = Number(q.maxFiles || 1);
    q.uploadPreviewFiles = Array.isArray(q.uploadPreviewFiles) ? q.uploadPreviewFiles : [];
  }
  if (type === "score") {
    q.scoreMax = Number(q.scoreMax || 5);
    q.scoreIcon = q.scoreIcon || "star";
  }
  if (type === "table_option" || type === "table_checkbox") {
    q.gridRows = Array.isArray(q.gridRows) && q.gridRows.length ? q.gridRows : ["Row 1", "Row 2"];
    q.gridCols = Array.isArray(q.gridCols) && q.gridCols.length ? q.gridCols : ["Col 1", "Col 2"];
  }
}

/**
 * Options ops
 */
function addOption(q) {
  q.options = Array.isArray(q.options) ? q.options : [];
  q.options.push(`Item ${q.options.length + 1}`);
}
function duplicateOption(q, i) {
  q.options = Array.isArray(q.options) ? q.options : [];
  const v = q.options[i] ?? "";
  q.options.splice(i + 1, 0, v);
}
function removeOption(q, i) {
  q.options = Array.isArray(q.options) ? q.options : [];
  q.options.splice(i, 1);
  if (!q.options.length) q.options.push("Choice 1");
}
function normalizeOptions(q) {
  q.options = (Array.isArray(q.options) ? q.options : []).map((x) => String(x ?? "")).filter((x) => stripHtml(x).length > 0);
  if (!q.options.length) q.options = ["Choice 1", "Choice 2"];
}

/**
 * Grid ops
 */
function addGridRow(q) {
  q.gridRows = Array.isArray(q.gridRows) ? q.gridRows : [];
  q.gridRows.push(`Row ${q.gridRows.length + 1}`);
}
function removeGridRow(q, i) {
  q.gridRows = Array.isArray(q.gridRows) ? q.gridRows : [];
  q.gridRows.splice(i, 1);
  if (!q.gridRows.length) q.gridRows = ["Row 1"];
}
function addGridCol(q) {
  q.gridCols = Array.isArray(q.gridCols) ? q.gridCols : [];
  q.gridCols.push(`Col ${q.gridCols.length + 1}`);
}
function removeGridCol(q, i) {
  q.gridCols = Array.isArray(q.gridCols) ? q.gridCols : [];
  q.gridCols.splice(i, 1);
  if (!q.gridCols.length) q.gridCols = ["Col 1"];
}
function normalizeGrid(q) {
  q.gridRows = (Array.isArray(q.gridRows) ? q.gridRows : []).map((x) => String(x ?? "")).filter((x) => stripHtml(x).length > 0);
  q.gridCols = (Array.isArray(q.gridCols) ? q.gridCols : []).map((x) => String(x ?? "")).filter((x) => stripHtml(x).length > 0);
  if (!q.gridRows.length) q.gridRows = ["Row 1", "Row 2"];
  if (!q.gridCols.length) q.gridCols = ["Col 1", "Col 2"];
}

/**
 * ==========================
 * File types menu
 * ==========================
 */
const FILE_TYPES = [
  { key: "image" },
  { key: "pdf" },
  { key: "doc" },
  { key: "docx" },
  { key: "xls" },
  { key: "xlsx" },
  { key: "ppt" },
  { key: "pptx" },
  { key: "zip" },
  { key: "txt" },
];
const openFileTypeFor = ref(null);

function toggleFileTypeMenu(qid) {
  openFileTypeFor.value = openFileTypeFor.value === qid ? null : qid;
}
function toggleFileType(q, key) {
  q.fileTypes = Array.isArray(q.fileTypes) ? q.fileTypes : [];
  const idx = q.fileTypes.indexOf(key);
  if (idx >= 0) q.fileTypes.splice(idx, 1);
  else q.fileTypes.push(key);
}

/**
 * ==========================
 * Upload preview handling (no backend upload)
 * ==========================
 */
const uploadInputRefs = reactive({});
function setUploadInputRef(qid, el) {
  if (el) uploadInputRefs[qid] = el;
}
function triggerUploadPick(qid) {
  uploadInputRefs[qid]?.click?.();
}
function uploadAcceptAttr(q) {
  if (!q.uploadRestrictEnabled) return "";
  const types = Array.isArray(q.fileTypes) ? q.fileTypes : [];
  const map = {
    image: "image/*",
    pdf: "application/pdf",
    doc: ".doc",
    docx: ".docx",
    xls: ".xls",
    xlsx: ".xlsx",
    ppt: ".ppt",
    pptx: ".pptx",
    zip: ".zip",
    txt: ".txt",
  };
  const accepts = types.map((t) => map[t]).filter(Boolean);
  return accepts.join(",");
}
function validateUpload(q, files) {
  const maxFiles = Number(q.maxFiles || 1);
  const maxSizeMB = Number(q.maxSizeMB || 10);
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (files.length > maxFiles) {
    showToast(`Too many files (max ${maxFiles})`, "danger");
    return false;
  }
  for (const f of files) {
    if (f.size > maxBytes) {
      showToast(`File too large (max ${maxSizeMB}MB)`, "danger");
      return false;
    }
  }
  return true;
}
function onUploadPick(e, q) {
  const files = Array.from(e?.target?.files || []);
  e.target.value = "";
  if (!files.length) return;
  if (!validateUpload(q, files)) return;

  q.uploadPreviewFiles = files.map((f) => ({
    id: uid(),
    name: f.name,
    size: f.size,
    type: f.type,
  }));
}
function onUploadDrop(e, q) {
  const files = Array.from(e.dataTransfer?.files || []);
  if (!files.length) return;
  if (!validateUpload(q, files)) return;

  q.uploadPreviewFiles = files.map((f) => ({
    id: uid(),
    name: f.name,
    size: f.size,
    type: f.type,
  }));
}
function removeUploadPreviewFile(q, fid) {
  q.uploadPreviewFiles = (q.uploadPreviewFiles || []).filter((x) => x.id !== fid);
}

/**
 * ==========================
 * Preview answer state
 * ==========================
 */
const previewEmail = ref("");
const previewAnswer = reactive({});
const previewScoreAnswer = reactive({});
const previewDateAnswer = reactive({});
const previewTableAnswer = reactive({});

/**
 * table preview helpers
 */
function ensureTableState(qid) {
  if (!previewTableAnswer[qid]) previewTableAnswer[qid] = { option: {}, checks: [] };
}
function isTableOptionChecked(q, ri, ci) {
  ensureTableState(q.id);
  return previewTableAnswer[q.id]?.option?.[ri] === ci;
}
function setTableOption(q, ri, ci) {
  ensureTableState(q.id);
  previewTableAnswer[q.id].option[ri] = ci;
}
function cellKey(qid, ri, ci) {
  return `${qid}:${ri}:${ci}`;
}
function isTableCheckboxChecked(q, ri, ci) {
  ensureTableState(q.id);
  const key = cellKey(q.id, ri, ci);
  return (previewTableAnswer[q.id].checks || []).includes(key);
}
function toggleTableCheckbox(q, ri, ci) {
  ensureTableState(q.id);
  const key = cellKey(q.id, ri, ci);
  const arr = previewTableAnswer[q.id].checks;
  const idx = arr.indexOf(key);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(key);
}

/**
 * ==========================
 * Draft payload -> DB
 * ==========================
 */
function normalizeDraftType(qq) {
  const t = qq?.type;
  if (
    t === "short" || t === "long" || t === "option" || t === "checkbox" || t === "dropdown" ||
    t === "upload" || t === "score" || t === "table_option" || t === "table_checkbox" ||
    t === "date" || t === "time"
  ) return t;
  return "short";
}

const apiPayload = computed(() => {
  const meta = {
    title: String(form.title ?? ""),
    description: String(form.description ?? ""),
    collectEmail: !!form.collectEmail,
    allowEditAfterSubmit: !!form.allowEditAfterSubmit,
  };

  const qs = questions.value.map((q, idx) => {
    const type = normalizeDraftType(q);

    const images = Array.isArray(q.images)
      ? q.images
          .map((x) => ({ id: String(x?.id || uid()), src: String(x?.src || ""), kind: String(x?.kind || "url") }))
          .filter((x) => x.src.trim().length > 0)
      : [];

    const base = {
      id: String(q.id || uid()),
      type,
      title: String(q.title ?? ""),
      description: String(q.description ?? ""),
      required: !!q.required,
      sort_order: Number(q.sort_order ?? (idx + 1)),
      images,
      options: [],
      upload: null,
      score: null,
      table: null,
    };

    if (needsOptions(type)) {
      base.options = (Array.isArray(q.options) ? q.options : []).map((x) => String(x ?? "")).filter((x) => x.length > 0);
    }

    if (type === "upload") {
      base.upload = {
        restrictEnabled: !!q.uploadRestrictEnabled,
        fileTypes: Array.isArray(q.fileTypes) ? q.fileTypes.filter(Boolean) : [],
        maxSizeMB: Number(q.maxSizeMB || 10),
        maxFiles: Number(q.maxFiles || 1),
      };
    }

    if (type === "score") {
      base.score = { max: Number(q.scoreMax || 5), icon: String(q.scoreIcon || "star") };
    }

    if (type === "table_option" || type === "table_checkbox") {
      base.table = {
        mode: type === "table_checkbox" ? "checkbox" : "option",
        rows: Array.isArray(q.gridRows) ? q.gridRows.map((x) => String(x ?? "")) : [],
        cols: Array.isArray(q.gridCols) ? q.gridCols.map((x) => String(x ?? "")) : [],
      };
    }

    return base;
  });

  qs.forEach((q, i) => (q.sort_order = i + 1));
  return { meta, questions: qs };
});

/**
 * ==========================
 * Local template store (คงของเดิมไว้)
 * ==========================
 */
const TPL_KEY = "lapnet_form_templates";
const uidTpl = () => `tpl_${Math.random().toString(16).slice(2)}_${Date.now()}`;

function readTemplatesStore() {
  try {
    const raw = localStorage.getItem(TPL_KEY);
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function writeTemplatesStore(arr) {
  try {
    localStorage.setItem(TPL_KEY, JSON.stringify(arr, null, 2));
  } catch {}
}
function upsertTemplateFromPayload(payload, sourceFormId, opts = {}) {
  try {
    const now = new Date().toISOString();
    const list = readTemplatesStore();

    const sfid = sourceFormId != null ? String(sourceFormId) : null;
    const serverId = opts?.serverId != null ? String(opts.serverId) : null;

    let t = null;
    if (sfid) t = list.find((x) => String(x?.sourceFormId || "") === sfid);

    const fallbackName = String(payload?.meta?.title || "").trim() || "Untitled template";

    if (!t) {
      list.unshift({
        id: uidTpl(),
        serverId,
        sourceFormId: sfid,
        name: fallbackName,
        note: "",
        createdAt: now,
        updatedAt: now,
        payload: cloneJsonSafe(payload),
      });
    } else {
      t.updatedAt = now;
      t.sourceFormId = sfid;
      t.payload = cloneJsonSafe(payload);
      if (serverId) t.serverId = serverId;
      if (!String(t.name || "").trim()) t.name = fallbackName;
      if (t.createdAt == null) t.createdAt = now;
    }

    writeTemplatesStore(list);

    if (sfid) localStorage.setItem("lapnet_last_template_sourceFormId", sfid);
    if (serverId) localStorage.setItem("lapnet_last_template_serverId", serverId);

    return true;
  } catch {
    return false;
  }
}

/**
 * ==========================
 * Save success alert
 * ==========================
 */
const saveAlert = reactive({ show: false, id: null, sourceFormId: null });

function openSaveAlert({ id, sourceFormId }) {
  saveAlert.show = true;
  saveAlert.id = id != null ? String(id) : null;
  saveAlert.sourceFormId = sourceFormId != null ? String(sourceFormId) : null;
}
function closeSaveAlert() {
  saveAlert.show = false;
  saveAlert.id = null;
  saveAlert.sourceFormId = null;
}
function goViewTemplates() {
  closeSaveAlert();
  router.push("/formtemplates");
}

/**
 * ==========================
 * IDs (bigint safe)
 * ==========================
 */
const formId = ref(null);
const templateServerId = ref(null);

function genDigitsId() {
  const r = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${Date.now()}${r}`;
}
function ensureSourceFormId() {
  if (formId.value && /^\d+$/.test(String(formId.value))) return String(formId.value);
  const id = genDigitsId();
  formId.value = id;
  return id;
}

/**
 * ==========================
 * DB API call: POST /api/form-templates/upsert
 * ✅ ส่งทั้ง sourceFormId + source_form_id เผื่อ backend ใช้ชื่อคนละแบบ
 * ✅ payload เป็น object JSON ล้วน
 * ==========================
 */
async function upsertTemplateToDB({ sourceFormId, payload, name, note, activetoggle = 0 }) {
  const sfid = sourceFormId != null ? String(sourceFormId).trim() : "";
  if (!/^\d+$/.test(sfid)) throw new Error("sourceFormId must be digits string");

  const cleanPayload = toPlainJson(payload);

  const body = {
    // ✅ เผื่อ backend รับ camel
    sourceFormId: sfid,
    // ✅ เผื่อ backend รับ snake
    source_form_id: sfid,

    name: String(name || "").trim() || String(cleanPayload?.meta?.title || "").trim() || "Untitled template",
    note: note == null ? null : String(note),

    // ✅ JSON column
    payload: cleanPayload,

    // ✅ tinyint(1)
    activetoggle: Number(activetoggle) ? 1 : 0,
  };

  const resp = await fetch(`${TEMPLATE_API}/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.ok) {
    const msg = data?.message || `Save template failed (${resp.status})`;
    throw new Error(msg);
  }

  return {
    id: data.id != null ? String(data.id) : null,
    sourceFormId: data.sourceFormId != null ? String(data.sourceFormId) : sfid,
    activetoggle: Number(data.activetoggle) ? 1 : 0,
  };
}

/**
 * Draft JSON text
 */
const jsonText = computed(() => {
  const payload = {
    ...apiPayload.value,
    updatedAt: new Date().toISOString(),
    sourceFormId: formId.value || null,
    templateId: templateServerId.value || null,
  };
  return JSON.stringify(payload, null, 2);
});

/**
 * ✅ SAVE (insert/update เข้า form_templates)
 */
const isSaving = ref(false);

async function saveDraft() {
  if (isSaving.value) return;
  isSaving.value = true;

  try {
    const sourceFormId = ensureSourceFormId();

    // ✅ แปลงเป็น JSON ล้วนก่อนส่ง
    const payload = toPlainJson(apiPayload.value);

    const r = await upsertTemplateToDB({
      sourceFormId,
      payload,
      name: String(payload?.meta?.title || "").trim() || "Untitled template",
      note: null,
      activetoggle: 0,
    });

    templateServerId.value = r.id;

    // local store (คงไว้)
    upsertTemplateFromPayload(payload, sourceFormId, { serverId: r.id });

    showToast(`Saved ✅ templateId=${r.id} sourceFormId=${sourceFormId}`);
    openSaveAlert({ id: r.id, sourceFormId });

    if (btnSaveRef.value) {
      gsap.fromTo(btnSaveRef.value, { scale: 1 }, { scale: 1.05, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" });
    }
  } catch (e) {
    showToast(e?.message || "Save failed", "danger");
  } finally {
    isSaving.value = false;
  }
}

/**
 * Copy / Download / Reset
 */
async function copyJson() {
  try {
    await navigator.clipboard.writeText(jsonText.value);
    showToast("Copied JSON");
  } catch {
    showToast("Copy failed", "danger");
  }
}
function downloadJson() {
  try {
    const blob = new Blob([jsonText.value], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(form.title || "form").replace(/\s+/g, "_").toLowerCase()}_draft.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Downloaded JSON");
  } catch {
    showToast("Download failed", "danger");
  }
}

/**
 * ✅ resetAll: เพิ่ม opts.silent และลบ draft key ทิ้ง
 */
function resetAll(opts = {}) {
  const silent = !!opts.silent;

  form.title = "";
  form.description = "";
  form.collectEmail = true;
  form.allowEditAfterSubmit = false;

  isPreview.value = false;

  formId.value = null;
  templateServerId.value = null;

  questions.value = [makeQuestion("short")];
  questions.value[0].sort_order = 1;

  previewEmail.value = "";

  Object.keys(previewAnswer).forEach((k) => delete previewAnswer[k]);
  Object.keys(previewScoreAnswer).forEach((k) => delete previewScoreAnswer[k]);
  Object.keys(previewDateAnswer).forEach((k) => delete previewDateAnswer[k]);
  Object.keys(previewTableAnswer).forEach((k) => delete previewTableAnswer[k]);

  // reset editor/menus/modals
  activeEditorEl.value = null;
  activeEditorMeta.qid = null;
  activeEditorMeta.editor = null;
  activeEditorMeta.idx = null;
  openFileTypeFor.value = null;

  closeOverlay();
  closeSaveAlert();

  // ✅ ลบ draft เก่าทิ้ง เพื่อไม่ให้หลงเหลือ
  try { localStorage.removeItem(DRAFT_KEY); } catch {}

  if (!silent) showToast("Reset");
}

/**
 * Toggle preview
 */
function initPreviewForQuestion(q) {
  if (!q?.id) return;
  if (q.type === "checkbox" && !Array.isArray(previewAnswer[q.id])) previewAnswer[q.id] = [];
  if (q.type === "date" && typeof previewDateAnswer[q.id] !== "string") previewDateAnswer[q.id] = String(previewDateAnswer[q.id] || "");
  if (q.type === "score" && typeof previewScoreAnswer[q.id] !== "number") previewScoreAnswer[q.id] = Number(previewScoreAnswer[q.id] || 0);
  if (q.type === "time") {
    if (Array.isArray(previewAnswer[q.id])) previewAnswer[q.id] = "";
    if (previewAnswer[q.id] == null) previewAnswer[q.id] = "";
  }
  if (q.type === "table_option" || q.type === "table_checkbox") ensureTableState(q.id);
}
function initPreviewState() {
  for (const q of questions.value) initPreviewForQuestion(q);
}
function togglePreview() {
  isPreview.value = !isPreview.value;
  if (isPreview.value) initPreviewState();
  nextTick(() => {
    const root = isPreview.value ? previewRef.value : builderRef.value;
    if (!root) return;
    gsap.killTweensOf(root);
    gsap.fromTo(root, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "power2.out" });
  });
}

/**
 * Submit preview (ยังไม่มี backend)
 */
const isSubmitting = ref(false);
async function submitPreview() {
  const missing = [];
  for (const q of questions.value) {
    if (!q.required) continue;

    if (q.type === "score") {
      if (!Number(previewScoreAnswer[q.id] || 0)) missing.push(q);
      continue;
    }
    if (q.type === "date") {
      if (!String(previewDateAnswer[q.id] || "").trim()) missing.push(q);
      continue;
    }
    if (q.type === "table_option" || q.type === "table_checkbox") {
      ensureTableState(q.id);
      const st = previewTableAnswer[q.id];
      const ok =
        q.type === "table_option"
          ? Object.keys(st.option || {}).length > 0
          : Array.isArray(st.checks) && st.checks.length > 0;
      if (!ok) missing.push(q);
      continue;
    }

    const ans = previewAnswer[q.id];
    const empty = ans == null || (typeof ans === "string" && !ans.trim()) || (Array.isArray(ans) && ans.length === 0);
    if (empty) missing.push(q);
  }

  if (form.collectEmail && !String(previewEmail.value || "").trim()) {
    showToast("Email is required", "danger");
    return;
  }

  if (missing.length) {
    showToast(`Missing required: ${missing.length} question(s)`, "danger");
    return;
  }

  showToast("Submit endpoint ยังไม่มีใน backend (ตอนนี้มีแค่ /api/form-templates/upsert)", "danger");
}

/**
 * ✅ mounted: เข้าเพจแล้ว "รีเฟรชทั้งหมด" ทุกครั้ง
 */
onMounted(async () => {
  resetAll({ silent: true });

  await nextTick();

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  if (topbarRef.value) tl.fromTo(topbarRef.value, { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, 0);
  if (metaCardRef.value) tl.fromTo(metaCardRef.value, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42 }, 0.08);
  if (builderRef.value) tl.fromTo(builderRef.value, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42 }, 0.12);
  if (sideToolsRef.value) tl.fromTo(sideToolsRef.value, { x: 14, opacity: 0 }, { x: 0, opacity: 1, duration: 0.42 }, 0.16);

  window.addEventListener("mousedown", onGlobalMouseDown);
});

function onGlobalMouseDown(e) {
  if (!openFileTypeFor.value) return;
  const el = e.target;
  const menu = document.querySelector(".fileTypeMenu");
  const btn = document.querySelector(".fileTypePicker .btn");
  if (menu && menu.contains(el)) return;
  if (btn && btn.contains(el)) return;
  openFileTypeFor.value = null;
}

onBeforeUnmount(() => {
  window.removeEventListener("mousedown", onGlobalMouseDown);
  if (toastTimer) clearTimeout(toastTimer);
});
</script>


<style scoped>
/* (คง style ของคุณไว้ตามเดิม) */
.createFormPage {
  width: 100%;
  height: 100%;
  padding: 10px 6px;
  color: var(--txt);
}

/* Toast */
.toast {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 99999;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: rgba(8, 12, 28, 0.72);
  backdrop-filter: blur(12px);
  color: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  opacity: 0;
  pointer-events: none;
  transform: translateY(6px);
}
.toast.show {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}
.toast.danger {
  border-color: rgba(248, 113, 113, 0.28);
}

/* ✅ NEW: Save alert content styling (uses existing overlay styles) */
.alertCard {
  width: min(520px, calc(100vw - 24px));
}
.alertText {
  font-size: 14px;
  font-weight: 950;
  color: rgba(255, 255, 255, 0.92);
}
.alertMeta {
  font-size: 12px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.72);
}

.pageTopbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 14px 10px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
  margin-bottom: 12px;
}

.titleRow {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pageTitle {
  margin: 0;
  font-size: 18px;
  font-weight: 950;
  letter-spacing: 0.2px;
}

.pill {
  font-size: 11px;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.18);
  color: rgba(255, 255, 255, 0.9);
}

.pageSub {
  margin: 6px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
}

.topRight {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 12px;
}
@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

.card {
  position: relative;
  border-radius: 18px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.25);
}

.btn {
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.1));
  color: rgba(255, 255, 255, 0.92);
  border-radius: 14px;
  padding: 10px 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 900;
  transition: background 180ms ease, transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}
.btn:hover {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.24), rgba(99, 102, 241, 0.14));
  border-color: rgba(56, 189, 248, 0.28);
  box-shadow: 0 14px 28px rgba(56, 189, 248, 0.1);
  transform: translateY(-1px);
}
.btn.ghost {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
}
.btn.ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(56, 189, 248, 0.22);
}
.btn.smallBtn {
  padding: 9px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.dangerBtn {
  border-color: rgba(248, 113, 113, 0.26) !important;
}
.dangerBtn:hover {
  border-color: rgba(248, 113, 113, 0.42) !important;
  background: rgba(248, 113, 113, 0.08) !important;
}

.miniBtn {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}
.miniBtn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(56, 189, 248, 0.18);
}
.miniBtn.danger {
  border-color: rgba(248, 113, 113, 0.18);
}
.miniBtn.danger:hover {
  border-color: rgba(248, 113, 113, 0.35);
  background: rgba(248, 113, 113, 0.08);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.label {
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.72);
}
.input,
.textarea,
.select {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.18);
  color: rgba(255, 255, 255, 0.92);
  padding: 10px 12px;
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
  direction: ltr;
  text-align: left;
  unicode-bidi: plaintext;
  writing-mode: horizontal-tb;
}
.input:focus,
.textarea:focus,
.select:focus {
  border-color: rgba(56, 189, 248, 0.35);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.1);
}
.textarea {
  resize: vertical;
}
.select {
  appearance: none;
}
.inputModern {
  background: rgba(8, 12, 28, 0.35);
  border-color: rgba(255, 255, 255, 0.12);
}

.richInput,
.optionInput {
  direction: ltr;
  text-align: left;
  unicode-bidi: plaintext;
  writing-mode: horizontal-tb;
}
.richInput {
  width: 100%;
  min-height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.18);
  color: rgba(255, 255, 255, 0.92);
  padding: 10px 12px;
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
  line-height: 1.45;
}
.richInput:focus {
  border-color: rgba(56, 189, 248, 0.35);
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.1);
}
.richInput:empty:before {
  content: attr(data-placeholder);
  color: rgba(255, 255, 255, 0.45);
}

.titleRich.hasLink,
.titleRich :deep(a) {
  color: rgba(248, 113, 113, 0.95) !important;
}
.titleRich :deep(a) {
  text-decoration: underline;
}

.switchWrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.switchWrap.compact {
  padding: 10px 10px;
}
.switch {
  width: 44px;
  height: 26px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  position: relative;
  transition: background 160ms ease, border-color 160ms ease;
}
.switch .knob {
  position: absolute;
  top: 50%;
  left: 4px;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  transition: left 160ms ease;
}
.switch.on {
  background: rgba(56, 189, 248, 0.22);
  border-color: rgba(56, 189, 248, 0.3);
}
.switch.on .knob {
  left: 20px;
}
.switchText {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.switchTitle {
  font-weight: 900;
  font-size: 12px;
}
.switchSub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
}

.metaCard {
  overflow: hidden;
}
.metaHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.metaBadge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.16);
}
.metaActions {
  display: inline-flex;
  gap: 8px;
}
.metaGrid {
  display: grid;
  gap: 10px;
}
.fieldRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
@media (max-width: 900px) {
  .fieldRow {
    grid-template-columns: 1fr;
  }
}

.builderHeader,
.previewHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 4px 8px;
  margin: 0 6px 8px;
}
.builderTitle,
.previewTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 950;
}
.builderHint,
.previewHint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}

.qList {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.qCard {
  overflow: hidden;
}
.qTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.qIndex {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.qBadge {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 950;
  background: rgba(56, 189, 248, 0.16);
  border: 1px solid rgba(56, 189, 248, 0.18);
}
.qTypePill {
  font-size: 11px;
  font-weight: 900;
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.82);
}
.qTools {
  display: inline-flex;
  gap: 8px;
}
.qGrid {
  display: grid;
  gap: 10px;
}

.formatBar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 10px;
}
.fmtBtn {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}
.fmtBtn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(56, 189, 248, 0.18);
}
.fmtHint {
  margin-left: auto;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 800;
}

.options {
  margin-top: 6px;
  padding: 10px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.optionsHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 10px;
}
.optionsHead.tight {
  margin-bottom: 6px;
}
.optionsTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 950;
  font-size: 12px;
}
.optionsList {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.optionRow {
  display: grid;
  grid-template-columns: 26px 1fr 34px 34px;
  gap: 10px;
  align-items: center;
}
.optionRowTight {
  grid-template-columns: 26px 1fr 34px;
}
.optionIcon {
  width: 26px;
  height: 26px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
}
.optionInput {
  width: 100%;
}
.optionsFoot {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}
.tinyBtn {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.86);
  border-radius: 12px;
  padding: 8px 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
  font-size: 12px;
}
.tinyBtn:hover {
  border-color: rgba(56, 189, 248, 0.18);
  background: rgba(255, 255, 255, 0.05);
}
.linkTiny {
  margin-left: 8px;
  padding: 6px 10px;
}
.hintTiny {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 800;
  margin-top: 6px;
}

/* Image preview under description */
.imgPreviewWrap {
  margin-top: 10px;
  padding: 10px;
  border-radius: 16px;
  background: rgba(56, 189, 248, 0.06);
  border: 1px solid rgba(56, 189, 248, 0.14);
}
.imgPreviewHead {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 950;
  font-size: 12px;
  margin-bottom: 8px;
}
.imgHint {
  margin-left: auto;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 800;
}
.imgGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
@media (max-width: 900px) {
  .imgGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.imgTile {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}
.imgTile img {
  max-width: 100%;
  max-height: 320px;
  width: auto;
  height: auto;
  display: block;
}
.imgRemove {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(248, 113, 113, 0.22);
  background: rgba(248, 113, 113, 0.10);
  color: rgba(255, 255, 255, 0.95);
  cursor: pointer;
}
.imgRemove:hover {
  border-color: rgba(248, 113, 113, 0.40);
  background: rgba(248, 113, 113, 0.14);
}

.fileSettings {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}
.fileTypePicker {
  position: relative;
  display: grid;
  gap: 10px;
}
.fileTypeMenu {
  position: absolute;
  top: 46px;
  left: 0;
  right: 0;
  z-index: 5;
  border-radius: 16px;
  padding: 10px;
  background: rgba(8, 12, 28, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.4);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
}
.fileTypeRow {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}
.chipRow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.18);
  color: rgba(255, 255, 255, 0.92);
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}
.chip.ghost {
  cursor: default;
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.75);
}
.chip i {
  font-size: 11px;
  opacity: 0.8;
}

.scorePreviewRow {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.scoreBtn {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}
.scoreBtn:hover {
  border-color: rgba(56, 189, 248, 0.18);
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-1px);
}
.previewScore .scoreBtn.active {
  border-color: rgba(56, 189, 248, 0.38);
  background: rgba(56, 189, 248, 0.10);
}

.gridEditor {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.gridCol {
  display: grid;
  gap: 8px;
}
@media (max-width: 900px) {
  .gridEditor {
    grid-template-columns: 1fr;
  }
}

.bottomAdd {
  display: flex;
  gap: 10px;
  padding: 12px 6px 4px;
  flex-wrap: wrap;
}

.sideTools {
  position: sticky;
  top: 14px;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.toolCard {
  border-radius: 18px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.22);
}
.toolTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 950;
  margin-bottom: 10px;
}
.toolBtn {
  width: 100%;
  border-radius: 14px;
  padding: 10px 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  transition: background 180ms ease, border-color 180ms ease, transform 180ms ease;
  margin-bottom: 8px;
}
.toolBtn:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(56, 189, 248, 0.18);
  transform: translateY(-1px);
}
.toolDivider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 8px 0;
}

.jsonBox {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.18);
}
.jsonHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.jsonTitle {
  font-weight: 950;
  font-size: 12px;
}
.jsonMeta {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 900;
}
.jsonPre {
  margin: 0;
  padding: 10px;
  font-size: 11px;
  line-height: 1.4;
  max-height: 360px;
  overflow: auto;
  color: rgba(255, 255, 255, 0.78);
}

.previewList {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.previewCard {
  margin-bottom: 10px;
}
.previewFormTitle {
  font-size: 18px;
  font-weight: 950;
}
.previewFormDesc {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  line-height: 1.5;
}
.previewEmail {
  margin-top: 12px;
}
.previewQTitle {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 950;
}
.qText :deep(a) {
  color: rgba(248, 113, 113, 0.95);
}
.qNum {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 12px;
  background: rgba(56, 189, 248, 0.14);
  border: 1px solid rgba(56, 189, 248, 0.16);
}
.req {
  margin-left: auto;
  color: rgba(248, 113, 113, 0.95);
}
.previewQDesc {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.58);
}
.previewControl {
  margin-top: 12px;
}
.choiceList {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.choiceRow {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}
.previewFooter {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 6px 4px;
}

.previewUpload {
  display: grid;
  gap: 10px;
}
.uploadMeta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.filePill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 950;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.10);
  border: 1px solid rgba(56, 189, 248, 0.16);
}
.fileHint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.58);
  font-weight: 800;
}
.dropZone {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.16);
  background: rgba(0, 0, 0, 0.14);
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
}
.dropZone:hover {
  border-color: rgba(56, 189, 248, 0.26);
  background: rgba(56, 189, 248, 0.06);
  transform: translateY(-1px);
}
.dzText {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dzTitle {
  font-weight: 950;
  font-size: 12px;
}
.dzSub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 800;
}
.hiddenInput {
  display: none;
}
.uploadList {
  display: grid;
  gap: 8px;
}
.uploadItem {
  display: grid;
  grid-template-columns: 18px 1fr 34px;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}
.uMeta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.uName {
  font-weight: 950;
  font-size: 12px;
}
.uSub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 800;
}

/* table preview */
.previewGrid {
  display: grid;
  gap: 10px;
}
.gridMeta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.gridPill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 950;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.10);
  border: 1px solid rgba(56, 189, 248, 0.16);
}
.gridHint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.58);
  font-weight: 800;
}
.gridTableWrap {
  overflow: auto;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.14);
}
.gridTable {
  width: 100%;
  border-collapse: collapse;
  min-width: 520px;
}
.gridTable th,
.gridTable td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  vertical-align: middle;
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
}
.gridTable th:last-child,
.gridTable td:last-child {
  border-right: none;
}
.gridCorner {
  width: 180px;
}
.gridRowHead {
  font-weight: 900;
  color: rgba(255, 255, 255, 0.9);
}
.gridCell {
  text-align: center;
}

/* overlay */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 99998;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(12px);
}
.overlayCard {
  width: min(560px, calc(100vw - 24px));
  border-radius: 18px;
  border: 1px solid rgba(56, 189, 248, 0.18);
  background: rgba(8, 12, 28, 0.78);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.55);
  overflow: hidden;
}
.overlayTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.10), rgba(99, 102, 241, 0.06));
}
.overlayTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 950;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.92);
}
.overlayBody {
  padding: 12px;
  display: grid;
  gap: 12px;
}
.overlayInput {
  background: rgba(0, 0, 0, 0.22);
  border-color: rgba(56, 189, 248, 0.20);
}
.overlayPreview {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(0, 0, 0, 0.14);
  overflow: hidden;
}
.overlayPreviewHead {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-weight: 950;
  font-size: 12px;
}
.overlayImgBox {
  padding: 10px;
}
.overlayImgBox img {
  width: 100%;
  max-height: 260px;
  object-fit: contain;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(0, 0, 0, 0.10);
}
.imgErr {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 900;
  color: rgba(248, 113, 113, 0.95);
}
.overlayActions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.overlayUploadRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
</style>
