<template>
  <div class="tplPage">
    <!-- Top bar -->
    <header class="pageTopbar">
      <div class="topLeft">
        <div class="titleRow">
          <i class="fa-solid fa-layer-group"></i>
          <h1 class="pageTitle">Form Templates</h1>
          <span class="pill">Storage</span>
        </div>
        <p class="pageSub">
          Store your form templates • Auto-save from the Save button (Create Form) • Import/Export JSON • Use a template
          to go back to Create Form
        </p>
      </div>

      <div class="topRight">
        <!-- ✅ (Optional) Save from Draft -->
        <button class="btn ghost" type="button" @click="openCreateFromDraft">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          <span>Save from Draft</span>
        </button>

        <button class="btn" type="button" @click="triggerImport">
          <i class="fa-solid fa-file-import"></i>
          <span>Import JSON</span>
        </button>

        <button class="btn ghost dangerBtn" type="button" @click="clearAll" :disabled="!templates.length">
          <i class="fa-solid fa-trash"></i>
          <span>Clear</span>
        </button>

        <input
          ref="importInputRef"
          type="file"
          class="hiddenInput"
          accept="application/json,.json"
          @change="onImportFile"
        />

        <!-- ✅ Image upload for question images (used in View/Edit modal) -->
        <input ref="imgInputRef" type="file" class="hiddenInput" accept="image/*" @change="onPickImageFile" />
      </div>
    </header>

    <!-- Search / sort -->
    <section class="card toolbar">
      <div class="toolLeft">
        <div class="field">
          <label class="label">Search</label>
          <input v-model="q" class="input" type="text" placeholder="Search by name / note..." />
        </div>

        <div class="field">
          <label class="label">Sort</label>
          <select v-model="sortBy" class="select">
            <option value="updated_desc">Updated (newest)</option>
            <option value="created_desc">Created (newest)</option>
            <option value="name_asc">Name A→Z</option>
            <option value="name_desc">Name Z→A</option>
          </select>
        </div>
      </div>

      <div class="toolRight">
        <div class="statPill">
          <i class="fa-solid fa-database"></i>
          <span>{{ filtered.length }} templates</span>
        </div>

        <div class="statPill ghost">
          <i class="fa-solid fa-clipboard-question"></i>
          <span>{{ totalQuestions }} questions</span>
        </div>
      </div>
    </section>

    <!-- List -->
    <section class="grid">
      <article v-for="t in filtered" :key="t.id" class="card tplCard" :class="{ inactive: !t.activetoggle }">
        <div class="tplTop">
          <div class="tplTitle">
            <div class="tplName">{{ t.name }}</div>
            <div class="tplMeta">
              <span class="metaItem">
                <i class="fa-regular fa-calendar"></i>
                Created: {{ fmtDate(t.createdAt) }}
              </span>
              <span class="metaItem">
                <i class="fa-regular fa-clock"></i>
                Updated: {{ fmtDate(t.updatedAt) }}
              </span>
            </div>
          </div>

          <div class="tplActions">
            <button
              class="miniBtn"
              type="button"
              :title="t.activetoggle ? 'Deactivate' : 'Activate'"
              @click="toggleActive(t)"
              :class="{ on: !!t.activetoggle, off: !t.activetoggle }"
              :disabled="isTogglePending(t.id)"
            >
              <i class="fa-solid" :class="t.activetoggle ? 'fa-toggle-on' : 'fa-toggle-off'"></i>
            </button>

            <button class="miniBtn" type="button" title="Rename" @click="openRename(t)">
              <i class="fa-solid fa-pen"></i>
            </button>

            <button class="miniBtn" type="button" title="Duplicate" @click="duplicateTemplate(t)">
              <i class="fa-solid fa-clone"></i>
            </button>

            <button class="miniBtn" type="button" title="Export JSON" @click="exportTemplate(t)">
              <i class="fa-solid fa-file-arrow-down"></i>
            </button>

            <button class="miniBtn danger" type="button" title="Delete" @click="deleteTemplate(t.id)">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <div class="tplBody">
          <div class="tplDesc">
            {{ t.note || "— No description —" }}
          </div>


          <!-- ✅ Thumbnails (images inside questions) -->
          <div v-if="tplThumbs(t).length" class="tplThumbs">
            <img
              v-for="(src, i) in tplThumbs(t)"
              :key="`${t.id}_th_${i}`"
              class="thumbImg"
              :src="resolveImgSrc(src, tplBust[t.id] || t.updatedAt || t.createdAt || t.id)"
              loading="lazy"
            />
            <span v-if="tplImageCount(t) > tplThumbs(t).length" class="thumbMore">
              +{{ tplImageCount(t) - tplThumbs(t).length }}
            </span>
          </div>

          <div class="chips">
            <span class="chip">
              <i class="fa-solid fa-list-check"></i>
              {{ (t.payload?.questions || []).length }} questions
            </span>

            <span class="chip ghost" :class="{ dangerChip: !t.activetoggle }">
              <i class="fa-solid" :class="t.activetoggle ? 'fa-circle-check' : 'fa-circle-xmark'"></i>
              Active: {{ t.activetoggle ? "ON" : "OFF" }}
            </span>

            <span v-if="t.sourceFormId" class="chip ghost">
              <i class="fa-solid fa-link"></i>
              FormID: {{ t.sourceFormId }}
            </span>

            <span class="chip ghost">
              <i class="fa-solid fa-envelope"></i>
              Collect email: {{ !!t.payload?.meta?.collectEmail ? "ON" : "OFF" }}
            </span>

            <span class="chip ghost">
              <i class="fa-solid fa-rotate"></i>
              Edit after submit: {{ !!t.payload?.meta?.allowEditAfterSubmit ? "ON" : "OFF" }}
            </span>
          </div>
        </div>

        <div class="tplFoot">
          <!-- ✅ View/Edit: fetch from API แล้วเปิด editor modal -->
          <button class="btn" type="button" @click="openViewEditor(t)">
            <i class="fa-solid fa-play"></i>
            <span>View template</span>
          </button>

          <!-- ✅ Preview button (between View template & View JSON) -->
          <button class="btn ghost" type="button" @click="openPreview(t)">
            <i class="fa-solid fa-eye"></i>
            <span>Preview</span>
          </button>

          <button class="btn ghost" type="button" @click="previewJson(t)">
            <i class="fa-solid fa-code"></i>
            <span>View JSON</span>
          </button>
        </div>
      </article>

      <div v-if="!filtered.length" class="empty card">
        <div class="emptyTitle">
          <i class="fa-regular fa-folder-open"></i>
          No templates yet
        </div>
        <div class="emptySub">
          Go to <b>Create Form</b> and click <b>Save</b> (it will auto-save as a template), or click <b>Save from Draft</b>.
        </div>
      </div>
    </section>

    <!-- ✅ VIEW/EDIT TEMPLATE MODAL (Smooth open/close) -->
    <Transition name="overlayFade" @after-leave="resetViewModal">
      <div v-if="viewModal.show" class="overlay" @mousedown.self="closeViewEditor()">
        <div class="overlayCard editorCard">
          <div class="overlayTop">
            <div class="overlayTitle">
              <i class="fa-solid" :class="viewModal.page === 'preview' ? 'fa-eye' : 'fa-pen-to-square'"></i>
              <span>
                {{ viewModal.page === "preview" ? "Preview" : "View/Edit" }}:
                {{ viewModal.name || "Template" }}
              </span>
              <span class="pill ghostPill" v-if="viewModal.sourceFormId">FormID: {{ viewModal.sourceFormId }}</span>
            </div>

            <div class="topBtns">
              <button class="miniBtn" type="button" title="Open in Create Form" @click="openInCreateFormFromModal">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </button>

              <!-- ✅ NEW: Preview button next to Save -->
              <button
                class="btn ghost"
                type="button"
                @click="togglePreviewPage"
                :disabled="viewModal.loading || viewModal.saving"
              >
                <i class="fa-solid" :class="viewModal.page === 'preview' ? 'fa-pen' : 'fa-eye'"></i>
                <span>{{ viewModal.page === "preview" ? "Back to Edit" : "Preview" }}</span>
              </button>

              <button class="btn" type="button" @click="saveViewEditor" :disabled="viewModal.saving || viewModal.loading">
                <i class="fa-solid" :class="viewModal.saving ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'"></i>
                <span>{{ viewModal.saving ? "Saving..." : "Save" }}</span>
              </button>

              <button class="miniBtn danger" type="button" @click="closeViewEditor()" :disabled="viewModal.saving">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          <div class="overlayBody editorBody">
            <div v-if="viewModal.loading" class="loadingRow">
              <i class="fa-solid fa-spinner fa-spin"></i>
              <span>Loading template...</span>
            </div>

            <template v-else>
              <!-- ✅ PAGE: PREVIEW MODE -->
              <div v-if="viewModal.page === 'preview'" class="previewWrap">
                <div class="card innerCard previewHeader">
                  <div class="previewTitleRow">
                    <div class="previewTitle">
                      <i class="fa-solid fa-file-lines"></i>
                      <span v-html="renderSafeHtml(viewModal.payload?.meta?.title || 'Untitled form')"></span>
                    </div>

                    <div class="previewMeta">
                      <span class="chip ghost">
                        <i class="fa-solid" :class="viewModal.activetoggle ? 'fa-circle-check' : 'fa-circle-xmark'"></i>
                        Active: {{ viewModal.activetoggle ? "ON" : "OFF" }}
                      </span>
                      <span class="chip ghost">
                        <i class="fa-solid fa-list-check"></i>
                        {{ (viewModal.payload.questions || []).length }} questions
                      </span>
                    </div>
                  </div>

                  <div v-if="viewModal.payload?.meta?.description" class="previewDesc">
                    {{ viewModal.payload.meta.description }}
                  </div>

                  <div class="previewFlags">
                    <span class="chip ghost">
                      <i class="fa-solid fa-envelope"></i>
                      Collect email: {{ viewModal.payload?.meta?.collectEmail ? "ON" : "OFF" }}
                    </span>
                    <span class="chip ghost">
                      <i class="fa-solid fa-rotate"></i>
                      Edit after submit: {{ viewModal.payload?.meta?.allowEditAfterSubmit ? "ON" : "OFF" }}
                    </span>
                  </div>

                  <!-- ✅ Collect email input (Preview) -->
                  <div v-if="viewModal.payload?.meta?.collectEmail" class="emailPreview">
                    <div class="emailRow">
                      <div class="emailLabel">
                        <i class="fa-solid fa-envelope"></i>
                        <span>Email</span>
                        <span class="req">*</span>
                      </div>
                      <input
                        v-model="viewModal.previewAnswers.__email"
                        class="input"
                        :class="{ dangerInput: viewModal.previewEmailTouched && !previewEmailOk }"
                        type="email"
                        placeholder="name@example.com"
                        required
                        @input="viewModal.previewEmailTouched = true"
                        @blur="viewModal.previewEmailTouched = true"
                      />
                    </div>
                    <div v-if="viewModal.previewEmailTouched && !previewEmailOk" class="emailErr">
                      Email is required (must be valid).
                    </div>
                  </div>

                </div>

                <div class="card innerCard">
                  <div class="innerTitle">
                    <i class="fa-solid fa-eye"></i>
                    <span>Preview Questions</span>
                  </div>

                  <div class="previewList">
                    <div v-for="(qq, idx) in viewModal.payload.questions" :key="qq.id" class="previewQ">
                      <div class="previewQTop">
                        <div class="previewQTitle">
                          <span class="qNum">{{ idx + 1 }}.</span>
                          <span v-html="renderSafeHtml(qq.title || 'Untitled question')"></span>
                          <span v-if="qq.required" class="req">*</span>
                        </div>
                        <div class="previewQType">
                          <span class="pill ghostPill">{{ qq.type }}</span>
                        </div>
                      </div>

                      <div v-if="qq.description" class="previewQDesc">{{ qq.description }}</div>


                      <!-- ✅ images preview -->
                      <div v-if="(qq.images || []).length" class="previewImgs">
                        <img
                          v-for="(im, ii) in (qq.images || [])"
                          :key="im.id || `${qq.id}_img_${ii}`"
                          class="previewImg"
                          :src="resolveImgSrc(im.src, (im && (im.v || (im.id && imgBust[im.id]))) || tplBust[viewModal.id] || viewModal.updatedAt || viewModal.id)"
                          loading="lazy"
                        />
                      </div>

                      <!-- short -->
                      <div v-if="qq.type === 'short'" class="previewField">
                        <input
                          v-model="viewModal.previewAnswers[qq.id]"
                          class="input"
                          type="text"
                          placeholder="Your answer..."
                        />
                      </div>

                      <!-- long -->
                      <div v-else-if="qq.type === 'long'" class="previewField">
                        <textarea
                          v-model="viewModal.previewAnswers[qq.id]"
                          class="textarea"
                          rows="3"
                          placeholder="Your answer..."
                        ></textarea>
                      </div>

                      <!-- option (radio) -->
                      <div v-else-if="qq.type === 'option'" class="previewField">
                        <div class="previewChoices">
                          <label v-for="(op, oi) in (qq.options || [])" :key="`${qq.id}_op_${oi}`" class="choiceRow">
                            <input
                              type="radio"
                              :name="`r_${qq.id}`"
                              :value="op"
                              v-model="viewModal.previewAnswers[qq.id]"
                            />
                            <span v-html="renderSafeHtml(op)"></span>
                          </label>
                        </div>
                      </div>

                      <!-- checkbox -->
                      <div v-else-if="qq.type === 'checkbox'" class="previewField">
                        <div class="previewChoices">
                          <label v-for="(op, oi) in (qq.options || [])" :key="`${qq.id}_cb_${oi}`" class="choiceRow">
                            <input
                              type="checkbox"
                              :value="op"
                              :checked="Array.isArray(viewModal.previewAnswers[qq.id]) && viewModal.previewAnswers[qq.id].includes(op)"
                              @change="togglePreviewCheckbox(qq.id, op, $event.target.checked)"
                            />
                            <span v-html="renderSafeHtml(op)"></span>
                          </label>
                        </div>
                      </div>

                      <!-- dropdown -->
                      <div v-else-if="qq.type === 'dropdown'" class="previewField">
                        <select v-model="viewModal.previewAnswers[qq.id]" class="select">
                          <option value="" disabled>Select…</option>
                          <option v-for="(op, oi) in (qq.options || [])" :key="`${qq.id}_dd_${oi}`" :value="op">
                            {{ asPlainText(op) }}
                          </option>
                        </select>
                      </div>

                      <!-- ✅ date/time (CLICK ANYWHERE -> showPicker immediately) -->
                      <div v-else-if="qq.type === 'date'" class="previewField">
                        <div class="pickerWrap" @click="openNativePicker($event)">
                          <input
                            v-model="viewModal.previewAnswers[qq.id]"
                            class="input pickerInput"
                            type="date"
                            @click.stop="openNativePicker($event)"
                          />
                        </div>
                      </div>
                      <div v-else-if="qq.type === 'time'" class="previewField">
                        <div class="pickerWrap" @click="openNativePicker($event)">
                          <input
                            v-model="viewModal.previewAnswers[qq.id]"
                            class="input pickerInput"
                            type="time"
                            @click.stop="openNativePicker($event)"
                          />
                        </div>
                      </div>

                      <!-- upload -->
                      <div v-else-if="qq.type === 'upload'" class="previewField">
                        <div class="uploadRow">
                          <input class="input" type="file" />
                          <div class="uploadHint">
                            Max {{ Number(qq.maxFiles || 1) }} file(s), {{ Number(qq.maxSizeMB || 10) }}MB each
                          </div>
                        </div>
                      </div>

                      <!-- score (icon picker) -->
                      <div v-else-if="qq.type === 'score'" class="previewField">
                        <div class="scorePicker">
                          <button
                            v-for="n in Number(qq.scoreMax || 5)"
                            :key="`${qq.id}_sc_${n}`"
                            type="button"
                            class="scoreIconBtn"
                            :class="{ on: Number(viewModal.previewAnswers[qq.id] || 0) >= n }"
                            :title="String(n)"
                            @click="setPreviewScore(qq.id, n)"
                          >
                            <i class="fa-solid" :class="scoreFaIcon(qq.scoreIcon)"></i>
                          </button>
                          <span class="scoreValue">{{ Number(viewModal.previewAnswers[qq.id] || 0) || '' }}</span>
                        </div>
                      </div>

                      <!-- table -->
                      <div v-else-if="qq.type === 'table_option' || qq.type === 'table_checkbox'" class="previewField">
                        <div class="tableWrap">
                          <table class="gridTable">
                            <thead>
                              <tr>
                                <th></th>
                                <th v-for="(c, ci) in (qq.gridCols || [])" :key="`${qq.id}_c_${ci}`">{{ c }}</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(r, ri) in (qq.gridRows || [])" :key="`${qq.id}_r_${ri}`">
                                <td class="rowHead">{{ r }}</td>
                                <td v-for="(c, ci) in (qq.gridCols || [])" :key="`${qq.id}_${ri}_${ci}`" class="cell">
                                  <input
                                    v-if="qq.type === 'table_checkbox'"
                                    type="checkbox"
                                    :checked="isPreviewTableChecked(qq.id, ri, ci)"
                                    @change="togglePreviewTableCell(qq.id, ri, ci, $event.target.checked, true)"
                                  />
                                  <input
                                    v-else
                                    type="radio"
                                    :name="`tbl_${qq.id}_${ri}`"
                                    :checked="isPreviewTableChecked(qq.id, ri, ci)"
                                    @change="togglePreviewTableCell(qq.id, ri, ci, true, false)"
                                  />
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <!-- fallback -->
                      <div v-else class="previewField">
                        <input class="input" type="text" placeholder="Preview not defined for this type" disabled />
                      </div>
                    </div>

                    <div v-if="!viewModal.payload.questions.length" class="emptyInner">No questions</div>
                  </div>
                </div>
              </div>

              <!-- ✅ PAGE: EDIT MODE -->
              <template v-else>
                <!-- Template fields -->
                <div class="editorGrid">
                  <div class="field">
                    <label class="label">Template name</label>
                    <input v-model="viewModal.name" class="input" type="text" placeholder="Template name" />
                  </div>

                  <div class="field">
                    <label class="label">Active</label>
                    <button
                      class="toggleBtn"
                      type="button"
                      @click="viewModal.activetoggle = viewModal.activetoggle ? 0 : 1"
                      :class="{ on: !!viewModal.activetoggle }"
                    >
                      <i class="fa-solid" :class="viewModal.activetoggle ? 'fa-toggle-on' : 'fa-toggle-off'"></i>
                      <span>{{ viewModal.activetoggle ? "ON" : "OFF" }}</span>
                    </button>
                  </div>

                  <div class="field editorSpan2">
                    <label class="label">Note</label>
                    <textarea v-model="viewModal.note" class="textarea" rows="2" placeholder="Short description..."></textarea>
                  </div>
                </div>

                <!-- Form meta -->
                <div class="card innerCard">
                  <div class="innerTitle">
                    <i class="fa-solid fa-sliders"></i>
                    <span>Form Meta</span>
                  </div>

                  <div class="editorGrid">
                    <div class="field">
                      <div class="labelRow">
                        <label class="label">Form title</label>
                        <button
                          class="miniBtn"
                          type="button"
                          :title="hasAnchor(viewModal.payload.meta.title) ? 'Edit hyperlink' : 'Add hyperlink'"
                          @click="toggleFormTitleLink()"
                        >
                          <i class="fa-solid" :class="hasAnchor(viewModal.payload.meta.title) ? 'fa-link-slash' : 'fa-link'"></i>
                        </button>
                      </div>
                      <input v-model="viewModal.payload.meta.title" class="input" type="text" placeholder="Form title" />
                      <div v-if="hasAnchor(viewModal.payload.meta.title)" class="smallHint">Preview will show a clickable link.</div>
                    </div>

                    <div class="field">
                      <label class="label">Collect email</label>
                      <button
                        class="toggleBtn"
                        type="button"
                        @click="viewModal.payload.meta.collectEmail = !viewModal.payload.meta.collectEmail"
                        :class="{ on: !!viewModal.payload.meta.collectEmail }"
                      >
                        <i
                          class="fa-solid"
                          :class="viewModal.payload.meta.collectEmail ? 'fa-toggle-on' : 'fa-toggle-off'"
                        ></i>
                        <span>{{ viewModal.payload.meta.collectEmail ? "ON" : "OFF" }}</span>
                      </button>
                    </div>

                    <div class="field editorSpan2">
                      <label class="label">Form description</label>
                      <textarea
                        v-model="viewModal.payload.meta.description"
                        class="textarea"
                        rows="3"
                        placeholder="Form description..."
                      ></textarea>
                    </div>

                    <div class="field">
                      <label class="label">Edit after submit</label>
                      <button
                        class="toggleBtn"
                        type="button"
                        @click="viewModal.payload.meta.allowEditAfterSubmit = !viewModal.payload.meta.allowEditAfterSubmit"
                        :class="{ on: !!viewModal.payload.meta.allowEditAfterSubmit }"
                      >
                        <i
                          class="fa-solid"
                          :class="viewModal.payload.meta.allowEditAfterSubmit ? 'fa-toggle-on' : 'fa-toggle-off'"
                        ></i>
                        <span>{{ viewModal.payload.meta.allowEditAfterSubmit ? "ON" : "OFF" }}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Questions editor -->
                <div class="card innerCard">
                  <div class="innerTop">
                    <div class="innerTitle">
                      <i class="fa-solid fa-list-check"></i>
                      <span>Questions</span>
                      <span class="pill ghostPill">{{ (viewModal.payload.questions || []).length }}</span>
                    </div>

                    <div class="innerActions">
                      <select v-model="viewModal.addType" class="select smallSelect">
                        <option value="short">Short</option>
                        <option value="long">Long</option>
                        <option value="option">Option</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="dropdown">Dropdown</option>
                        <option value="date">Date</option>
                        <option value="time">Time</option>
                        <option value="upload">Upload</option>
                        <option value="score">Score</option>
                        <option value="table_option">Table option</option>
                        <option value="table_checkbox">Table checkbox</option>
                      </select>
                      <button class="btn" type="button" @click="addQuestionInModal">
                        <i class="fa-solid fa-plus"></i>
                        <span>Add question</span>
                      </button>
                    </div>
                  </div>

                  <!-- ✅ GSAP Flip will animate reorder inside this container -->
                  <div ref="qListRef" class="qList">
                    <div v-for="(qq, idx) in viewModal.payload.questions" :key="qq.id" class="qItem">
                      <div class="qHead">
                        <div class="qLeft">
                          <div class="qIndex">#{{ idx + 1 }}</div>

                          <select v-model="qq.type" class="select smallSelect" @change="onModalTypeChange(qq)">
                            <option value="short">Short</option>
                            <option value="long">Long</option>
                            <option value="option">Option</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="dropdown">Dropdown</option>
                            <option value="date">Date</option>
                            <option value="time">Time</option>
                            <option value="upload">Upload</option>
                            <option value="score">Score</option>
                            <option value="table_option">Table option</option>
                            <option value="table_checkbox">Table checkbox</option>
                          </select>

                          <!-- ✅ REQUIRED: toggle ON/OFF (must answer) -->
                          <button
                            class="toggleBtn smallToggle"
                            type="button"
                            @click="qq.required = !qq.required"
                            :class="{ on: !!qq.required }"
                            :title="qq.required ? 'Required (ON)' : 'Required (OFF)'"
                          >
                            <i class="fa-solid" :class="qq.required ? 'fa-toggle-on' : 'fa-toggle-off'"></i>
                            <span>Required: {{ qq.required ? "ON" : "OFF" }}</span>
                          </button>
                        </div>

                        <div class="qRight">
                          <button
                            class="miniBtn"
                            type="button"
                            title="Move up"
                            @click="moveQuestion(idx, -1)"
                            :disabled="idx === 0"
                          >
                            <i class="fa-solid fa-arrow-up"></i>
                          </button>
                          <button
                            class="miniBtn"
                            type="button"
                            title="Move down"
                            @click="moveQuestion(idx, +1)"
                            :disabled="idx === viewModal.payload.questions.length - 1"
                          >
                            <i class="fa-solid fa-arrow-down"></i>
                          </button>
                          <button class="miniBtn" type="button" title="Duplicate" @click="duplicateQuestionInModal(idx)">
                            <i class="fa-solid fa-clone"></i>
                          </button>
                          <button
                            class="miniBtn danger"
                            type="button"
                            title="Remove question"
                            @click="removeQuestionInModal(idx)"
                          >
                            <i class="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>

                      <div class="qBody">
                        <div class="field">
                          <div class="labelRow">
                            <label class="label">Title</label>
                            <button class="miniBtn" type="button" title="Add/Edit hyperlink" @click="setQuestionTitleLink(qq)">
                              <i class="fa-solid fa-link"></i>
                            </button>
                            <button
                              v-if="hasAnchor(qq.title)"
                              class="miniBtn danger"
                              type="button"
                              title="Remove hyperlink"
                              @click="removeQuestionTitleLink(qq)"
                            >
                              <i class="fa-solid fa-link-slash"></i>
                            </button>
                          </div>
                          <input v-model="qq.title" class="input" type="text" placeholder="Question title..." />
                          <div v-if="hasAnchor(qq.title)" class="smallHint">Preview will show a clickable link.</div>
                        </div>

                        <div class="field">
                          <label class="label">Description</label>
                          <textarea v-model="qq.description" class="textarea" rows="2" placeholder="Optional..."></textarea>
                        </div>


                        <!-- ✅ Images editor (upload / URL / replace) -->
                        <div class="imgBox">
                          <div class="imgTop">
                            <div class="imgTitle">
                              <i class="fa-regular fa-image"></i>
                              <span>Images</span>
                              <span class="pill ghostPill">{{ (qq.images || []).length }}</span>
                            </div>

                            <div class="imgActions">
                              <button class="btn ghost" type="button" @click="triggerAddQImage(qq)">
                                <i class="fa-solid fa-upload"></i>
                                <span>Upload</span>
                              </button>
                            </div>
                          </div>

                          <div class="imgAddRow">
                            <input
                              v-model="imgUrlDraft[qq.id]"
                              class="input imgUrlInput"
                              type="text"
                              placeholder="Paste image URL (http... or /uploads/...)"
                            />
                            <button class="miniBtn" type="button" title="Add URL" @click="addQImageUrl(qq)">
                              <i class="fa-solid fa-plus"></i>
                            </button>
                          </div>

                          <div v-if="(qq.images || []).length" class="imgGrid">
                            <div v-for="(im, ii) in (qq.images || [])" :key="im.id || `${qq.id}_im_${ii}`" class="imgTile">
                              <img class="imgPreview" :src="resolveImgSrc(im.src, (im && (im.v || (im.id && imgBust[im.id]))) || tplBust[viewModal.id] || viewModal.updatedAt || viewModal.id)" loading="lazy" />
                              <input v-model="im.src" class="input imgUrlInput" type="text" placeholder="image url" />

                              <div class="imgBtns">
                                <button class="miniBtn" type="button" title="Replace" @click="triggerReplaceQImage(qq, ii)">
                                  <i class="fa-solid fa-arrows-rotate"></i>
                                </button>
                                <button class="miniBtn danger" type="button" title="Remove" @click="removeQImage(qq, ii)">
                                  <i class="fa-solid fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div v-else class="imgEmpty">No images</div>
                        </div>

                        <!-- ✅ OPTIONS editor: add/remove option -->
                        <div v-if="needsOptions(qq.type)" class="optBox">
                          <div class="optTop">
                            <div class="optTitle">
                              <i class="fa-solid fa-list"></i>
                              <span>Options</span>
                              <span class="pill ghostPill">{{ (qq.options || []).length }}</span>
                            </div>
                            <button class="btn ghost" type="button" @click="addOptionInModal(qq)">
                              <i class="fa-solid fa-plus"></i>
                              <span>Add option</span>
                            </button>
                          </div>

                          <div class="optList">
                            <div v-for="(op, oi) in qq.options" :key="`${qq.id}_${oi}`" class="optRow">
                              <input
                                v-model="qq.options[oi]"
                                class="input optInput"
                                type="text"
                                :placeholder="`Option ${oi + 1}`"
                              />
                              <button
                                class="miniBtn"
                                type="button"
                                :title="hasAnchor(qq.options[oi]) ? 'Edit hyperlink' : 'Add hyperlink'"
                                @click="toggleOptionLink(qq, oi)"
                              >
                                <i class="fa-solid" :class="hasAnchor(qq.options[oi]) ? 'fa-link-slash' : 'fa-link'"></i>
                              </button>
                              <button class="miniBtn danger" type="button" title="Remove option" @click="removeOptionInModal(qq, oi)">
                                <i class="fa-solid fa-xmark"></i>
                              </button>
                            </div>
                          </div>
                        </div>

                        <!-- Upload settings (minimal) -->
                        <div v-if="qq.type === 'upload'" class="miniSettings">
                          <div class="field">
                            <label class="label">Max size (MB)</label>
                            <input v-model.number="qq.maxSizeMB" class="input" type="number" min="1" />
                          </div>
                          <div class="field">
                            <label class="label">Max files</label>
                            <input v-model.number="qq.maxFiles" class="input" type="number" min="1" />
                          </div>
                        </div>

                        <!-- Score settings (minimal) -->
                        <div v-if="qq.type === 'score'" class="miniSettings">
                          <div class="field">
                            <label class="label">Max score</label>
                            <input v-model.number="qq.scoreMax" class="input" type="number" min="1" max="10" />
                          </div>

                          <div class="field">
                            <label class="label">Icon</label>

                            <!-- ✅ visual icon picker -->
                            <div class="iconPick">
                              <button
                                type="button"
                                class="iconPickBtn"
                                :class="{ on: (qq.scoreIcon || 'star') === 'star' }"
                                @click="qq.scoreIcon = 'star'"
                                title="Star"
                              >
                                <i class="fa-solid fa-star"></i>
                              </button>
                              <button
                                type="button"
                                class="iconPickBtn"
                                :class="{ on: (qq.scoreIcon || 'star') === 'heart' }"
                                @click="qq.scoreIcon = 'heart'"
                                title="Heart"
                              >
                                <i class="fa-solid fa-heart"></i>
                              </button>
                              <button
                                type="button"
                                class="iconPickBtn"
                                :class="{ on: (qq.scoreIcon || 'star') === 'like' }"
                                @click="qq.scoreIcon = 'like'"
                                title="Like"
                              >
                                <i class="fa-solid fa-thumbs-up"></i>
                              </button>
                            </div>

                            <!-- (optional) keep select for compatibility -->
                            <select v-model="qq.scoreIcon" class="select">
                              <option value="star">Star</option>
                              <option value="heart">Heart</option>
                              <option value="like">Like</option>
                            </select>
                          </div>
                        </div>

                        <!-- Table settings (minimal) -->
                        <div v-if="qq.type === 'table_option' || qq.type === 'table_checkbox'" class="miniSettings">
                          <div class="field">
                            <label class="label">Rows (comma separated)</label>
                            <input
                              class="input"
                              type="text"
                              :value="(qq.gridRows || []).join(', ')"
                              @input="qq.gridRows = splitComma($event.target.value)"
                            />
                          </div>
                          <div class="field">
                            <label class="label">Cols (comma separated)</label>
                            <input
                              class="input"
                              type="text"
                              :value="(qq.gridCols || []).join(', ')"
                              @input="qq.gridCols = splitComma($event.target.value)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div v-if="!viewModal.payload.questions.length" class="emptyInner">No questions</div>
                  </div>
                </div>
              </template>
            </template>
          </div>
        </div>
      </div>
    </Transition>

    <!-- JSON Preview Overlay -->
    <div v-if="jsonModal.show" class="overlay" @mousedown.self="closeJson">
      <div class="overlayCard">
        <div class="overlayTop">
          <div class="overlayTitle">
            <i class="fa-solid fa-code"></i>
            <span>Template JSON: {{ jsonModal.title }}</span>
          </div>
          <button class="miniBtn danger" type="button" @click="closeJson">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="overlayBody">
          <pre class="jsonPre">{{ jsonModal.text }}</pre>
          <div class="overlayActions">
            <button class="btn ghost" type="button" @click="copyJsonModal">
              <i class="fa-solid fa-copy"></i>
              Copy
            </button>
            <button class="btn" type="button" @click="closeJson">
              <i class="fa-solid fa-check"></i>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Rename Modal -->
    <div v-if="editModal.show" class="overlay" @mousedown.self="closeEdit">
      <div class="overlayCard">
        <div class="overlayTop">
          <div class="overlayTitle">
            <i class="fa-solid" :class="editModal.mode === 'create' ? 'fa-wand-magic-sparkles' : 'fa-pen'"></i>
            <span>{{ editModal.mode === "create" ? "Save Template from Draft" : "Rename Template" }}</span>
          </div>
          <button class="miniBtn danger" type="button" @click="closeEdit">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="overlayBody">
          <div class="field">
            <label class="label">Template name</label>
            <input v-model="editModal.name" class="input" type="text" placeholder="e.g., Job application form" />
          </div>

          <div class="field">
            <label class="label">Note (optional)</label>
            <textarea v-model="editModal.note" class="textarea" rows="3" placeholder="Short description..." />
          </div>

          <div class="field">
            <label class="label">Active</label>
            <div class="activeRow">
              <button
                class="toggleBtn"
                type="button"
                @click="editModal.activetoggle = Number(editModal.activetoggle) ? 0 : 1"
                :class="{ on: !!Number(editModal.activetoggle) }"
              >
                <i class="fa-solid" :class="Number(editModal.activetoggle) ? 'fa-toggle-on' : 'fa-toggle-off'"></i>
                <span>{{ Number(editModal.activetoggle) ? "ON" : "OFF" }}</span>
              </button>
              <div class="activeHint">OFF = ปิดการแสดง / ใช้งานไม่ได้ จนกว่าจะเปิด ON</div>
            </div>
          </div>

          <div class="overlayActions">
            <button class="btn ghost" type="button" @click="closeEdit">
              <i class="fa-solid fa-arrow-left"></i>
              Cancel
            </button>

            <button class="btn" type="button" @click="confirmEdit" :disabled="!editModal.name.trim()">
              <i class="fa-solid fa-check"></i>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ✅ Link Prompt Overlay (nicer than window.prompt) -->
    <div v-if="linkPrompt.show" class="overlay" @mousedown.self="closeLinkPrompt">
      <div class="overlayCard linkCard">
        <div class="overlayTop">
          <div class="overlayTitle">
            <i class="fa-solid fa-link"></i>
            <span>Hyperlink</span>
            <span v-if="linkPrompt.label" class="pill ghostPill">{{ linkPrompt.label }}</span>
          </div>
          <button class="miniBtn danger" type="button" @click="closeLinkPrompt" title="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="overlayBody">
          <div class="field">
            <label class="label">URL</label>
            <input
              ref="linkInputRef"
              v-model="linkPrompt.url"
              class="input"
              type="url"
              dir="ltr"
              placeholder="https://example.com"
              @keydown.enter.prevent="applyLinkPrompt"
            />

            <div class="linkMetaRow">
              <span class="pill ghostPill">Text: {{ linkPromptText || "Link" }}</span>
            </div>
            <div class="smallHint">Preview will show the text as a clickable link (URL will not be shown).</div>
          </div>

          <div class="overlayActions">
            <button class="btn ghost" type="button" @click="closeLinkPrompt">
              <i class="fa-solid fa-arrow-left"></i>
              Cancel
            </button>

            <button v-if="linkPromptHasExisting" class="btn ghost dangerBtn" type="button" @click="removeLinkPrompt">
              <i class="fa-solid fa-link-slash"></i>
              Remove link
            </button>

            <button class="btn" type="button" @click="applyLinkPrompt" :disabled="!String(linkPrompt.url || '').trim()">
              <i class="fa-solid fa-check"></i>
              Apply URL
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ✅ NICE ALERT (beauty) -->
    <Transition name="alertPop">
      <div v-if="niceAlert.show" class="niceAlert" :class="niceAlert.type" role="status" aria-live="polite">
        <div class="niceAlertIcon">
          <i
            class="fa-solid"
            :class="niceAlert.type === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-check'"
          ></i>
        </div>
        <div class="niceAlertText">
          <div class="niceAlertTitle">{{ niceAlert.title }}</div>
          <div class="niceAlertSub">{{ niceAlert.text }}</div>
        </div>
        <button class="niceAlertClose" type="button" @click="niceAlert.show = false" title="Close">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </Transition>

    <!-- Toast -->
    <div class="toast" :class="{ show: toast.show, danger: toast.type === 'danger' }" aria-live="polite">
      <i class="fa-solid" :class="toast.type === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-check'"></i>
      <span>{{ toast.text }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";

/* ✅ GSAP for swap/move animation (Flip) */
import { gsap } from "gsap";
import Flip from "gsap/Flip";
gsap.registerPlugin(Flip);

/**
 * ✅ ไม่เปลี่ยน URL ตามที่ขอ
 */
const BASE_URL = import.meta.env.VITE_FORM_TPL_API || "http://localhost:3000/api/form-templates";

const DRAFT_KEY = "lapnet_create_form_draft";
const router = useRouter();

const templates = ref([]);
const q = ref("");
const sortBy = ref("updated_desc");
const importInputRef = ref(null);

/* ✅ GSAP target ref */
const qListRef = ref(null);


/* =========================
   ✅ Images (template thumbnails + question image upload/replace)
========================= */

// hidden <input type="file"> for images
const imgInputRef = ref(null);

// draft URL per questionId
const imgUrlDraft = reactive({});

// state: which question should receive the picked file
const imgPick = reactive({ qid: null, replaceIndex: null });

// cache-bust maps (fix: replace image but URL same => browser cache shows old)
// - tplBust[templateId] will change after Save
// - imgBust[imageId] will change after Replace/Upload
const tplBust = reactive({});
const imgBust = reactive({});

const SERVER_ORIGIN = (() => {
  try {
    if (/^https?:\/\//i.test(BASE_URL)) return new URL(BASE_URL).origin;
  } catch {
    // ignore
  }
  // same origin fallback (when BASE_URL is relative)
  try {
    return window.location.origin;
  } catch {
    return "";
  }
})();

function appendCacheBust(url, bust) {
  const b = bust == null ? "" : String(bust).trim();
  if (!b) return url;
  const u = String(url || "");
  if (!u) return u;
  if (/^data:/i.test(u) || /^blob:/i.test(u)) return u;
  // keep existing query
  const sep = u.includes("?") ? "&" : "?";
  return `${u}${sep}v=${encodeURIComponent(b)}`;
}

function resolveImgSrc(src, bust) {
  const s = String(src || "").trim();
  if (!s) return "";
  if (/^data:/i.test(s)) return s;
  if (/^blob:/i.test(s)) return s;
  if (/^https?:\/\//i.test(s)) return appendCacheBust(s, bust);
  if (s.startsWith("/")) return appendCacheBust(`${SERVER_ORIGIN}${s}`, bust);
  return appendCacheBust(s, bust);
}

function genImgId() {
  return `img_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = () => reject(new Error("Read file failed"));
    fr.readAsDataURL(file);
  });
}

function ensureQImages(qq) {
  qq.images = Array.isArray(qq.images) ? qq.images : [];
  // ensure each has id for backend overwrite support
  qq.images.forEach((im) => {
    if (im && typeof im === "object" && !im.id) im.id = genImgId();
  });
}

function triggerAddQImage(qq) {
  if (!qq?.id) return;
  ensureQImages(qq);
  imgPick.qid = String(qq.id);
  imgPick.replaceIndex = null;
  imgInputRef.value?.click?.();
}

function triggerReplaceQImage(qq, ii) {
  if (!qq?.id) return;
  ensureQImages(qq);
  imgPick.qid = String(qq.id);
  imgPick.replaceIndex = Number(ii);
  imgInputRef.value?.click?.();
}

function removeQImage(qq, ii) {
  ensureQImages(qq);
  qq.images.splice(Number(ii), 1);
}

function addQImageUrl(qq) {
  if (!qq?.id) return;
  const url = String(imgUrlDraft[qq.id] || "").trim();
  if (!url) return;
  ensureQImages(qq);
  const nid = genImgId();
  const v = Date.now();
  qq.images.push({ id: nid, src: url, kind: "url", v });
  imgBust[nid] = v;
  imgUrlDraft[qq.id] = "";
}

async function onPickImageFile(e) {
  const file = e?.target?.files?.[0];
  if (!file) return;

  try {
    const dataUrl = await readFileAsDataURL(file);
    const qid = String(imgPick.qid || "");
    if (!qid) return;

    const qq = (viewModal.payload?.questions || []).find((x) => String(x?.id) === qid);
    if (!qq) return;

    ensureQImages(qq);

    // replace
    if (imgPick.replaceIndex != null && Number.isFinite(imgPick.replaceIndex)) {
      const ii = Number(imgPick.replaceIndex);
      const cur = qq.images[ii];
      if (cur && typeof cur === "object") {
        // keep same id => backend will overwrite img_<id>.webp
        cur.src = dataUrl;
        cur.kind = "upload";
        cur.fileName = file.name;
        cur.v = Date.now();
        if (cur.id) imgBust[cur.id] = cur.v;
      } else {
        const nid = genImgId();
        const v = Date.now();
        qq.images[ii] = { id: nid, src: dataUrl, kind: "upload", fileName: file.name, v };
        imgBust[nid] = v;
      }
    } else {
      // add new
      const nid = genImgId();
      const v = Date.now();
      qq.images.push({ id: nid, src: dataUrl, kind: "upload", fileName: file.name, v });
      imgBust[nid] = v;
    }
  } catch (err) {
    showToast(err?.message || "Image read failed", "danger");
  } finally {
    try {
      if (e?.target) e.target.value = "";
    } catch {
      // ignore
    }
    imgPick.qid = null;
    imgPick.replaceIndex = null;
  }
}

// Template thumbnails (from payload)
function collectPayloadImageSrcs(payload) {
  const out = [];
  const qs = payload?.questions;
  if (!Array.isArray(qs)) return out;
  for (const q of qs) {
    const ims = q?.images;
    if (!Array.isArray(ims)) continue;
    for (const im of ims) {
      const src = im?.src ?? im;
      if (src) out.push(String(src));
    }
  }
  return out;
}

function tplImageCount(t) {
  return collectPayloadImageSrcs(t?.payload).length;
}

function tplThumbs(t, limit = 4) {
  return collectPayloadImageSrcs(t?.payload).slice(0, Number(limit) || 4);
}


function captureFlipState() {
  try {
    const el = qListRef.value;
    if (!el) return null;
    const items = el.querySelectorAll(".qItem");
    if (!items || !items.length) return null;
    return Flip.getState(items);
  } catch {
    return null;
  }
}

function playFlip(state) {
  if (!state) return;
  Flip.from(state, {
    duration: 0.28,
    ease: "power2.out",
    absolute: true,
    stagger: 0.01,
    nested: true,
  });
}

/* ✅ open native date/time picker by clicking ANYWHERE in field */
function openNativePicker(e) {
  try {
    const target = e?.currentTarget;

    // if event came from input itself
    let input = null;
    if (target && target.tagName === "INPUT") input = target;
    else input = target?.querySelector?.("input");

    if (!input) return;

    // focus + open picker immediately (Chrome/Edge)
    input.focus({ preventScroll: true });

    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

// ✅ pending toggle (reactive)
const pendingToggle = ref(new Set());
function isTogglePending(id) {
  return pendingToggle.value.has(String(id));
}

const toast = reactive({ show: false, text: "", type: "ok" });
let toastTimer = null;

function showToast(text, type = "ok") {
  toast.text = String(text || "");
  toast.type = type;
  toast.show = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.show = false), 2200);
}

/* ✅ NICE ALERT (beauty) */
const niceAlert = reactive({ show: false, title: "", text: "", type: "success" });
let niceAlertTimer = null;

function showNiceAlert(title = "Saved", text = "Save successful", type = "success") {
  niceAlert.title = String(title || "");
  niceAlert.text = String(text || "");
  niceAlert.type = type === "danger" ? "danger" : "success";
  niceAlert.show = true;

  if (niceAlertTimer) clearTimeout(niceAlertTimer);
  niceAlertTimer = setTimeout(() => (niceAlert.show = false), 1700);
}

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer);
  if (niceAlertTimer) clearTimeout(niceAlertTimer);
});

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
}

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

// =====================
// ✅ HTML/link helpers (safe render in Preview)
// =====================
function escapeHtmlText(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeHref(href) {
  const h = String(href ?? '').trim();
  if (!h) return '#';
  // allow http(s), mailto, tel
  if (/^(https?:\/\/|mailto:|tel:)/i.test(h)) return h;
  // if user typed example.com -> make https
  if (/^[\w.-]+\.[A-Za-z]{2,}(\/|$)/.test(h)) return 'https://' + h;
  return '#';
}

function stripHtmlText(s) {
  try {
    const div = document.createElement('div');
    div.innerHTML = String(s ?? '');
    return (div.textContent || '').trim();
  } catch {
    return String(s ?? '').replace(/<[^>]*>/g, '').trim();
  }
}

function hasAnchor(s) {
  return /<a\b[^>]*href\s*=\s*['"][^'"]+['"][^>]*>/i.test(String(s ?? ''));
}

function renderSafeHtml(s) {
  const raw = String(s ?? '');
  // if contains <a>, normalize to safe single anchor
  if (hasAnchor(raw)) {
    try {
      const div = document.createElement('div');
      div.innerHTML = raw;
      const a = div.querySelector('a');
      if (a) {
        const href = safeHref(a.getAttribute('href'));
        const txt = (a.textContent || '').trim() || stripHtmlText(raw) || 'Link';
        return `<a href="${escapeHtmlText(href)}" target="_blank" rel="noopener noreferrer">${escapeHtmlText(txt)}</a>`;
      }
    } catch {
      // ignore
    }
  }
  // no html: escape
  return escapeHtmlText(raw);
}

function makeAnchor(text, href) {
  const h = safeHref(href);
  const t = String(text ?? '').trim() || 'Link';
  return `<a href="${escapeHtmlText(h)}" target="_blank" rel="noopener noreferrer">${escapeHtmlText(t)}</a>`;
}


function normalizeDraftType(t) {
  const ok = new Set([
    "short",
    "long",
    "option",
    "checkbox",
    "dropdown",
    "upload",
    "score",
    "table_option",
    "table_checkbox",
    "date",
    "time",
  ]);
  if (t === "paragraph") return "long";
  if (t === "mc") return "option";
  if (t === "file") return "upload";
  if (ok.has(t)) return t;
  return "short";
}

function needsOptions(type) {
  return type === "option" || type === "checkbox" || type === "dropdown";
}

function splitComma(s) {
  return String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function normalizePayload(raw) {
  const meta = raw?.meta || {};
  const qs = Array.isArray(raw?.questions) ? raw.questions : [];

  const payload = {
    meta: {
      title: String(meta.title ?? ""),
      description: String(meta.description ?? ""),
      collectEmail: !!meta.collectEmail,
      allowEditAfterSubmit: !!meta.allowEditAfterSubmit,
    },
    questions: qs.map((q, idx) => {
      const type = normalizeDraftType(q?.type);

      const base = {
        id: String(q?.id || `q_${idx}_${Date.now()}`),
        type,
        title: String(q?.title ?? ""),
        description: String(q?.description ?? ""),
        required: !!q?.required,
        sort_order: Number(q?.sort_order ?? idx + 1),

        images: Array.isArray(q?.images) ? q.images : [],
        options: Array.isArray(q?.options) ? q.options : [],

        uploadRestrictEnabled: !!q?.uploadRestrictEnabled,
        fileTypes: Array.isArray(q?.fileTypes) ? q.fileTypes : [],
        maxSizeMB: Number(q?.maxSizeMB ?? 10),
        maxFiles: Number(q?.maxFiles ?? 1),
        uploadPreviewFiles: [],

        scoreMax: Number(q?.scoreMax ?? 5),
        scoreIcon: String(q?.scoreIcon ?? "star"),

        gridRows: Array.isArray(q?.gridRows) ? q.gridRows : [],
        gridCols: Array.isArray(q?.gridCols) ? q.gridCols : [],
      };

      // if saved in "builder payload shape"
      if (q?.upload && typeof q.upload === "object") {
        base.uploadRestrictEnabled = !!q.upload.restrictEnabled;
        base.fileTypes = Array.isArray(q.upload.fileTypes) ? q.upload.fileTypes : base.fileTypes;
        base.maxSizeMB = Number(q.upload.maxSizeMB ?? base.maxSizeMB);
        base.maxFiles = Number(q.upload.maxFiles ?? base.maxFiles);
      }
      if (q?.score && typeof q.score === "object") {
        base.scoreMax = Number(q.score.max ?? base.scoreMax);
        base.scoreIcon = String(q.score.icon ?? base.scoreIcon);
      }
      if (q?.table && typeof q.table === "object") {
        const mode = q.table.mode === "checkbox" ? "table_checkbox" : "table_option";
        base.type = normalizeDraftType(mode);
        base.gridRows = Array.isArray(q.table.rows) ? q.table.rows : base.gridRows;
        base.gridCols = Array.isArray(q.table.cols) ? q.table.cols : base.gridCols;
      }

      // ensure options for option-type
      if (needsOptions(base.type) && (!Array.isArray(base.options) || !base.options.length)) {
        base.options = ["Choice 1", "Choice 2"];
      }
      if (base.type === "table_option" || base.type === "table_checkbox") {
        if (!base.gridRows?.length) base.gridRows = ["Row 1", "Row 2"];
        if (!base.gridCols?.length) base.gridCols = ["Col 1", "Col 2"];
      }

      return base;
    }),
  };

  payload.questions.forEach((qq, i) => (qq.sort_order = i + 1));
  return payload;
}

/* =========================
   ✅ API
========================= */

async function apiList() {
  const r = await fetch(`${BASE_URL}`, { method: "GET", headers: { Accept: "application/json" } });
  const data = await r.json().catch(() => null);
  if (!r.ok || !data?.ok) throw new Error(data?.message || "Load templates failed");
  return Array.isArray(data.items) ? data.items : [];
}

async function apiGetById(id) {
  const r = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const data = await r.json().catch(() => null);
  if (!r.ok || !data?.ok) throw new Error(data?.message || "Load template failed");
  return data?.item;
}

async function apiUpsert(body) {
  const r = await fetch(`${BASE_URL}/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => null);
  if (!r.ok || !data?.ok) throw new Error(data?.message || "Upsert failed");
  return data;
}

async function apiDelete(id) {
  const r = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  const data = await r.json().catch(() => null);
  if (!r.ok || !data?.ok) throw new Error(data?.message || "Delete failed");
  return data;
}

async function apiClearAll() {
  const r = await fetch(`${BASE_URL}`, { method: "DELETE", headers: { Accept: "application/json" } });
  const data = await r.json().catch(() => null);
  if (!r.ok || !data?.ok) throw new Error(data?.message || "Clear failed");
  return data;
}

async function refreshTemplates() {
  const items = await apiList();
  templates.value = items.map((t) => ({
    id: t.id,
    sourceFormId: t.sourceFormId ?? t.source_form_id ?? null,
    name: t.name ?? "Untitled template",
    note: t.note ?? "",
    payload: normalizePayload(typeof t.payload === "string" ? safeJsonParse(t.payload) : t.payload || {}),
    createdAt: t.createdAt ?? t.created_at ?? null,
    updatedAt: t.updatedAt ?? t.updated_at ?? null,
    activetoggle: Number(t.activetoggle ?? 0) ? 1 : 0,
  }));
}

/* =========================
   ✅ computed
========================= */

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase();
  let list = templates.value.filter((t) => {
    if (!term) return true;
    return String(t.name || "").toLowerCase().includes(term) || String(t.note || "").toLowerCase().includes(term);
  });

  const s = sortBy.value;
  if (s === "updated_desc") list.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  else if (s === "created_desc") list.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  else if (s === "name_asc") list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  else if (s === "name_desc") list.sort((a, b) => String(b.name || "").localeCompare(String(a.name || "")));

  return list;
});

const totalQuestions = computed(() => templates.value.reduce((sum, t) => sum + (t.payload?.questions?.length || 0), 0));

/* =========================
   ✅ JSON modal
========================= */

const jsonModal = reactive({ show: false, title: "", text: "" });

function previewJson(t) {
  jsonModal.show = true;
  jsonModal.title = t.name;
  jsonModal.text = JSON.stringify(
    { sourceFormId: t.sourceFormId, activetoggle: t.activetoggle, payload: t.payload, name: t.name, note: t.note },
    null,
    2
  );
}

async function copyJsonModal() {
  try {
    await navigator.clipboard.writeText(jsonModal.text || "");
    showToast("Copied JSON");
  } catch {
    showToast("Copy failed", "danger");
  }
}

function closeJson() {
  jsonModal.show = false;
  jsonModal.title = "";
  jsonModal.text = "";
}

/* =========================
   ✅ Create/Rename Modal
========================= */

const editModal = reactive({
  show: false,
  mode: "create",
  name: "",
  note: "",
  activetoggle: 0,
  targetId: null,
  __payload: null,
  __sourceFormId: null,
});

function closeEdit() {
  editModal.show = false;
  editModal.mode = "create";
  editModal.name = "";
  editModal.note = "";
  editModal.activetoggle = 0;
  editModal.targetId = null;
  editModal.__payload = null;
  editModal.__sourceFormId = null;
}

function openCreateFromDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  const draft = safeJsonParse(raw);

  if (!draft || !draft.meta || !Array.isArray(draft.questions)) {
    showToast("No draft found. Go to Create Form and click Save first.", "danger");
    return;
  }

  const sourceFormId = draft?.sourceFormId ?? draft?.id ?? draft?.meta?.sourceFormId ?? null;
  if (!sourceFormId) {
    showToast("Draft missing sourceFormId (required to save to DB)", "danger");
    return;
  }

  const payload = normalizePayload(draft);

  editModal.show = true;
  editModal.mode = "create";
  editModal.name = String(payload.meta.title || "").trim() || "Untitled template";
  editModal.note = "";
  editModal.activetoggle = 0;
  editModal.targetId = "__CREATE__";
  editModal.__payload = payload;
  editModal.__sourceFormId = sourceFormId;
}

function openRename(t) {
  editModal.show = true;
  editModal.mode = "rename";
  editModal.name = t.name;
  editModal.note = t.note || "";
  editModal.activetoggle = Number(t.activetoggle) ? 1 : 0;
  editModal.targetId = t.id;
  editModal.__payload = t.payload;
  editModal.__sourceFormId = t.sourceFormId;
}

async function confirmEdit() {
  const name = editModal.name.trim();
  const note = String(editModal.note || "").trim();
  const activetoggle = Number(editModal.activetoggle) ? 1 : 0;
  if (!name) return;

  const payload = editModal.__payload;
  const sourceFormId = editModal.__sourceFormId;

  if (!payload) return showToast("Missing payload", "danger");
  if (!sourceFormId) return showToast("Missing sourceFormId", "danger");

  try {
    await apiUpsert({
      sourceFormId,
      source_form_id: sourceFormId,
      name,
      note,
      payload,
      activetoggle,
    });
    await refreshTemplates();

    // cache-bust list thumbnails (same image URL)
    if (editModal.targetId && editModal.targetId !== "__CREATE__") tplBust[String(editModal.targetId)] = Date.now();

    showToast(editModal.mode === "create" ? "Template saved" : "Updated");
    closeEdit();
  } catch (e) {
    showToast(e?.message || "Save failed", "danger");
  }
}

/* =========================
   ✅ Toggle Active
========================= */

async function toggleActive(t) {
  if (!t?.id) return;
  const id = String(t.id);

  if (pendingToggle.value.has(id)) return;
  if (!t.sourceFormId) return showToast("Missing sourceFormId", "danger");

  pendingToggle.value.add(id);

  const prev = Number(t.activetoggle) ? 1 : 0;
  const next = prev ? 0 : 1;

  t.activetoggle = next; // optimistic

  try {
    await apiUpsert({
      sourceFormId: t.sourceFormId,
      source_form_id: t.sourceFormId,
      name: t.name,
      note: t.note,
      payload: t.payload,
      activetoggle: next,
    });
    showToast(next ? "Activated" : "Deactivated");
  } catch (e) {
    t.activetoggle = prev; // rollback
    showToast(e?.message || "Toggle failed", "danger");
  } finally {
    pendingToggle.value.delete(id);
  }
}

/* =========================
   ✅ VIEW/EDIT MODAL
========================= */

const viewModal = reactive({
  show: false,
  loading: false,
  saving: false,
  page: "edit",
  id: null,
  updatedAt: null,
  sourceFormId: null,
  name: "",
  note: "",
  activetoggle: 0,
  payload: { meta: { title: "", description: "", collectEmail: false, allowEditAfterSubmit: false }, questions: [] },
  addType: "short",

  previewAnswers: {},
  previewTable: {},

  // ✅ Collect email preview validation
  previewEmailTouched: false,
});


// ✅ Preview email required when Collect email = ON
const previewNeedEmail = computed(() => !!viewModal.payload?.meta?.collectEmail);
const previewEmailOk = computed(() => {
  if (!previewNeedEmail.value) return true;
  const v = String(viewModal.previewAnswers?.__email || '').trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
});

watch(previewNeedEmail, (on) => {
  if (!on) {
    try {
      if (viewModal.previewAnswers) delete viewModal.previewAnswers.__email;
    } catch {}
    viewModal.previewEmailTouched = false;
  }
});

/* =========================
   ✅ Link Prompt Overlay (nicer than window.prompt)
========================= */

const linkInputRef = ref(null);

const linkPrompt = reactive({
  show: false,
  kind: "", // metaTitle | qTitle | option
  qid: null,
  oi: null,
  label: "",
  url: "",
});

function findModalQuestionById(qid) {
  const list = viewModal.payload?.questions || [];
  const id = String(qid ?? "");
  return list.find((x) => String(x?.id ?? "") === id) || null;
}

function getLinkTargetHtml(kind, qid, oi) {
  try {
    if (kind === "metaTitle") return String(viewModal.payload?.meta?.title ?? "");

    if (kind === "qTitle") {
      const qq = findModalQuestionById(qid);
      return qq ? String(qq.title ?? "") : "";
    }

    if (kind === "option") {
      const qq = findModalQuestionById(qid);
      if (!qq) return "";
      qq.options = Array.isArray(qq.options) ? qq.options : [];
      const i = Number(oi);
      return Number.isFinite(i) ? String(qq.options[i] ?? "") : "";
    }
  } catch {
    // ignore
  }
  return "";
}

function setLinkTargetHtml(kind, qid, oi, value) {
  if (kind === "metaTitle") {
    if (!viewModal.payload?.meta) viewModal.payload.meta = { title: "", description: "", collectEmail: false, allowEditAfterSubmit: false };
    viewModal.payload.meta.title = String(value ?? "");
    return true;
  }

  if (kind === "qTitle") {
    const qq = findModalQuestionById(qid);
    if (!qq) return false;
    qq.title = String(value ?? "");
    return true;
  }

  if (kind === "option") {
    const qq = findModalQuestionById(qid);
    if (!qq) return false;
    qq.options = Array.isArray(qq.options) ? qq.options : [];
    const i = Number(oi);
    if (!Number.isFinite(i)) return false;
    while (qq.options.length <= i) qq.options.push("");
    qq.options[i] = String(value ?? "");
    return true;
  }

  return false;
}

function extractHref(html) {
  const s = String(html ?? "");
  const m = s.match(/href\s*=\s*["']([^"']+)["']/i);
  return (m?.[1] || "").trim();
}

const linkPromptCurrentHtml = computed(() => getLinkTargetHtml(linkPrompt.kind, linkPrompt.qid, linkPrompt.oi));
const linkPromptHasExisting = computed(() => hasAnchor(linkPromptCurrentHtml.value));
const linkPromptText = computed(() => {
  const txt = stripHtmlText(linkPromptCurrentHtml.value);
  if (txt) return txt;
  if (linkPrompt.kind === "option") return String(linkPrompt.label || "Option");
  if (linkPrompt.kind === "qTitle") return "Question";
  if (linkPrompt.kind === "metaTitle") return "Form title";
  return "Link";
});

function openLinkPrompt(kind, opts = {}) {
  linkPrompt.kind = String(kind || "");
  linkPrompt.qid = opts.qid ?? null;
  linkPrompt.oi = opts.oi ?? null;
  linkPrompt.label = String(opts.label || "");

  const cur = getLinkTargetHtml(linkPrompt.kind, linkPrompt.qid, linkPrompt.oi);
  linkPrompt.url = extractHref(cur) || "https://";
  linkPrompt.show = true;

  nextTick(() => {
    try {
      linkInputRef.value?.focus?.();
      linkInputRef.value?.select?.();
    } catch {
      // ignore
    }
  });
}

function closeLinkPrompt() {
  linkPrompt.show = false;
  linkPrompt.kind = "";
  linkPrompt.qid = null;
  linkPrompt.oi = null;
  linkPrompt.label = "";
  linkPrompt.url = "";
}

function applyLinkPrompt() {
  const url = String(linkPrompt.url || "").trim();
  if (!url) return showToast("Please enter URL", "danger");

  const txt = String(linkPromptText.value || "Link").trim() || "Link";
  const ok = setLinkTargetHtml(linkPrompt.kind, linkPrompt.qid, linkPrompt.oi, makeAnchor(txt, url));
  if (!ok) return showToast("Cannot apply link (missing target)", "danger");

  showToast("Link applied");
  closeLinkPrompt();
}

function removeLinkPrompt() {
  const txt = stripHtmlText(linkPromptCurrentHtml.value) || "";
  const ok = setLinkTargetHtml(linkPrompt.kind, linkPrompt.qid, linkPrompt.oi, txt);
  if (!ok) return showToast("Cannot remove link (missing target)", "danger");
  showToast("Link removed");
  closeLinkPrompt();
}

function toggleFormTitleLink() {
  openLinkPrompt("metaTitle", { label: "Form title" });
}

function setQuestionTitleLink(qq) {
  if (!qq) return;
  openLinkPrompt("qTitle", { qid: qq.id, label: "Question title" });
}

function removeQuestionTitleLink(qq) {
  if (!qq) return;
  qq.title = stripHtmlText(qq.title);
}

function toggleOptionLink(qq, oi) {
  if (!qq || oi == null) return;
  openLinkPrompt("option", { qid: qq.id, oi, label: `Option ${Number(oi) + 1}` });
}
function resetViewModal() {
  viewModal.loading = false;
  viewModal.saving = false;
  viewModal.page = "edit";
  viewModal.id = null;
  viewModal.updatedAt = null;
  viewModal.sourceFormId = null;
  viewModal.name = "";
  viewModal.note = "";
  viewModal.activetoggle = 0;
  viewModal.payload = { meta: { title: "", description: "", collectEmail: false, allowEditAfterSubmit: false }, questions: [] };
  viewModal.addType = "short";
  viewModal.previewAnswers = {};
  viewModal.previewTable = {};
}

function togglePreviewPage() {
  viewModal.page = viewModal.page === "preview" ? "edit" : "preview";
}

function normalizeSortOrdersInModal() {
  (viewModal.payload.questions || []).forEach((qq, i) => (qq.sort_order = i + 1));
}

async function openViewEditor(t, initialPage = "edit") {
  if (!t?.id) return;
  viewModal.show = true;
  viewModal.loading = true;
  viewModal.saving = false;
  viewModal.page = initialPage === "preview" ? "preview" : "edit";

  // reset preview state whenever opening
  viewModal.previewAnswers = {};
  viewModal.previewTable = {};
  viewModal.previewEmailTouched = false;

  try {
    const item = await apiGetById(t.id);
    const payload = normalizePayload(typeof item?.payload === "string" ? safeJsonParse(item.payload) : item?.payload || {});

    viewModal.id = String(item?.id || t.id);
    viewModal.updatedAt = item?.updatedAt ?? item?.updated_at ?? t.updatedAt ?? t.updated_at ?? null;
    viewModal.sourceFormId = item?.sourceFormId ?? item?.source_form_id ?? t.sourceFormId ?? null;
    viewModal.name = item?.name ?? t.name ?? "Untitled template";
    viewModal.note = item?.note ?? t.note ?? "";
    viewModal.activetoggle = Number(item?.activetoggle ?? t.activetoggle ?? 0) ? 1 : 0;

    viewModal.payload = deepClone(payload);
    if (!viewModal.payload?.meta) viewModal.payload.meta = { title: "", description: "", collectEmail: false, allowEditAfterSubmit: false };
    if (!Array.isArray(viewModal.payload.questions)) viewModal.payload.questions = [];
    normalizeSortOrdersInModal();
  } catch (e) {
    showToast(e?.message || "Load template failed", "danger");
    viewModal.show = false;
  } finally {
    viewModal.loading = false;
  }
}

async function openPreview(t) {
  return openViewEditor(t, "preview");
}

function closeViewEditor(force = false) {
  if (viewModal.saving && !force) return;
  viewModal.show = false;
}

function makeQuestion(type = "short") {
  const nowId = `q_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const q = {
    id: nowId,
    type: normalizeDraftType(type),
    title: "",
    description: "",
    required: false,
    sort_order: 1,
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
  };

  if (needsOptions(q.type)) q.options = ["Choice 1", "Choice 2"];
  if (q.type === "table_option" || q.type === "table_checkbox") {
    q.gridRows = ["Row 1", "Row 2"];
    q.gridCols = ["Col 1", "Col 2"];
  }
  return q;
}

function onModalTypeChange(qq) {
  qq.type = normalizeDraftType(qq.type);
  if (needsOptions(qq.type)) {
    qq.options = Array.isArray(qq.options) ? qq.options : [];
    if (!qq.options.length) qq.options = ["Choice 1", "Choice 2"];
  }
  if (qq.type === "upload") {
    qq.maxSizeMB = Number(qq.maxSizeMB || 10);
    qq.maxFiles = Number(qq.maxFiles || 1);
  }
  if (qq.type === "score") {
    qq.scoreMax = Number(qq.scoreMax || 5);
    qq.scoreIcon = String(qq.scoreIcon || "star");
  }
  if (qq.type === "table_option" || qq.type === "table_checkbox") {
    qq.gridRows = Array.isArray(qq.gridRows) && qq.gridRows.length ? qq.gridRows : ["Row 1", "Row 2"];
    qq.gridCols = Array.isArray(qq.gridCols) && qq.gridCols.length ? qq.gridCols : ["Col 1", "Col 2"];
  }
}

function addQuestionInModal() {
  const state = captureFlipState();
  viewModal.payload.questions.push(makeQuestion(viewModal.addType));
  normalizeSortOrdersInModal();
  nextTick(() => playFlip(state));
}

function removeQuestionInModal(idx) {
  const state = captureFlipState();
  viewModal.payload.questions.splice(idx, 1);
  normalizeSortOrdersInModal();
  nextTick(() => playFlip(state));
}

function duplicateQuestionInModal(idx) {
  const src = viewModal.payload.questions[idx];
  if (!src) return;
  const state = captureFlipState();
  const copy = deepClone(src);
  copy.id = `q_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  viewModal.payload.questions.splice(idx + 1, 0, copy);
  normalizeSortOrdersInModal();
  nextTick(() => playFlip(state));
}

function moveQuestion(idx, delta) {
  const list = viewModal.payload.questions;
  const ni = idx + delta;
  if (ni < 0 || ni >= list.length) return;

  const state = captureFlipState();

  const [item] = list.splice(idx, 1);
  list.splice(ni, 0, item);

  normalizeSortOrdersInModal();
  nextTick(() => playFlip(state));
}

function addOptionInModal(qq) {
  qq.options = Array.isArray(qq.options) ? qq.options : [];
  qq.options.push(`Option ${qq.options.length + 1}`);
}

function removeOptionInModal(qq, oi) {
  qq.options = Array.isArray(qq.options) ? qq.options : [];
  qq.options.splice(oi, 1);
  if (!qq.options.length) qq.options = ["Choice 1"];
}


function addImageUrl(qq) {
  if (!qq?.id) return;
  const key = String(qq.id);
  const url = String(imgUrlDraft[key] || "").trim();
  if (!url) return;

  const imgs = ensureImagesArr(qq);
  imgs.push({ id: genImgId(), src: url, kind: "url" });
  imgUrlDraft[key] = "";
}

function removeImage(qq, ii) {
  const imgs = ensureImagesArr(qq);
  imgs.splice(Number(ii), 1);
}

/* ===== Preview helpers ===== */

function togglePreviewCheckbox(qid, value, checked) {
  const k = String(qid);
  const cur = Array.isArray(viewModal.previewAnswers[k]) ? viewModal.previewAnswers[k] : [];
  const set = new Set(cur);
  if (checked) set.add(value);
  else set.delete(value);
  viewModal.previewAnswers[k] = Array.from(set);
}

function ensurePreviewTable(qid) {
  const k = String(qid);
  if (!viewModal.previewTable[k]) viewModal.previewTable[k] = {};
  return viewModal.previewTable[k];
}

function isPreviewTableChecked(qid, ri, ci) {
  const k = String(qid);
  const tbl = viewModal.previewTable[k];
  if (!tbl) return false;

  const rowKey = String(ri);
  const val = tbl[rowKey];

  if (Array.isArray(val)) return val.includes(ci);
  if (typeof val === "number") return val === ci;
  return false;
}

function togglePreviewTableCell(qid, ri, ci, checked, isCheckbox) {
  const k = String(qid);
  const tbl = ensurePreviewTable(k);
  const rowKey = String(ri);

  if (isCheckbox) {
    const cur = Array.isArray(tbl[rowKey]) ? tbl[rowKey] : [];
    const set = new Set(cur);
    if (checked) set.add(ci);
    else set.delete(ci);
    tbl[rowKey] = Array.from(set);
  } else {
    if (checked) tbl[rowKey] = ci;
  }
}


function scoreFaIcon(icon) {
  const s = String(icon || "star");
  if (s === "heart") return "fa-heart";
  if (s === "like") return "fa-thumbs-up";
  return "fa-star";
}

function setPreviewScore(qid, n) {
  const k = String(qid);
  const v = Number(n || 0);
  viewModal.previewAnswers[k] = v;
}

/* ===== Save (nice alert + auto close overlay) ===== */

async function saveViewEditor() {
  if (viewModal.loading || viewModal.saving) return;

  const name = String(viewModal.name || "").trim() || "Untitled template";
  const note = String(viewModal.note || "").trim();
  const sourceFormId = String(viewModal.sourceFormId || "").trim();
  const activetoggle = Number(viewModal.activetoggle) ? 1 : 0;

  if (!/^\d+$/.test(sourceFormId)) return showToast("sourceFormId must be digits string", "danger");

  normalizeSortOrdersInModal();
  viewModal.payload.meta = viewModal.payload.meta || {};
  viewModal.payload.meta.title = String(viewModal.payload.meta.title || "");
  viewModal.payload.meta.description = String(viewModal.payload.meta.description || "");
  viewModal.payload.meta.collectEmail = !!viewModal.payload.meta.collectEmail;
  viewModal.payload.meta.allowEditAfterSubmit = !!viewModal.payload.meta.allowEditAfterSubmit;

  for (const qq of viewModal.payload.questions) {
    qq.type = normalizeDraftType(qq.type);
    if (needsOptions(qq.type)) {
      qq.options = (Array.isArray(qq.options) ? qq.options : [])
        .map((x) => String(x ?? "").trim())
        .filter(Boolean);
      if (!qq.options.length) qq.options = ["Choice 1"];
    }
  }

  viewModal.saving = true;
  try {
    await apiUpsert({
      sourceFormId,
      source_form_id: sourceFormId,
      name,
      note,
      payload: deepClone(viewModal.payload),
      activetoggle,
    });

    await refreshTemplates();

    // ✅ cache-bust: ensure replaced images show new file, not browser cache
    if (viewModal.id) tplBust[String(viewModal.id)] = Date.now();

    showToast("Saved");
    showNiceAlert("Saved!", "Template saved successfully", "success");

    // ✅ close overlay automatically
    closeViewEditor(true);
  } catch (e) {
    showToast(e?.message || "Save failed", "danger");
    showNiceAlert("Save failed", e?.message || "Please try again", "danger");
  } finally {
    viewModal.saving = false;
  }
}

function openInCreateFormFromModal() {
  try {
    const draft = {
      id: null,
      sourceFormId: viewModal.sourceFormId,
      meta: viewModal.payload.meta,
      questions: viewModal.payload.questions,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft, null, 2));
    showToast("Loaded → Create Form");
    router.push("/createform");
  } catch {
    showToast("Open Create Form failed", "danger");
  }
}

/* =========================
   ✅ Duplicate / Delete / Clear / Import / Export
========================= */

function duplicateTemplate(_t) {
  showToast("Duplicate needs a NEW sourceFormId (unique).", "danger");
}

async function deleteTemplate(id) {
  try {
    await apiDelete(id);
    await refreshTemplates();
    showToast("Deleted");
  } catch (e) {
    showToast(e?.message || "Delete failed", "danger");
  }
}

async function clearAll() {
  try {
    await apiClearAll();
    await refreshTemplates();
    showToast("Cleared");
  } catch (e) {
    showToast(e?.message || "Clear failed", "danger");
  }
}

function exportTemplate(t) {
  try {
    const out = {
      name: t.name,
      note: t.note,
      sourceFormId: t.sourceFormId,
      activetoggle: t.activetoggle,
      payload: t.payload,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${String(t.name || "template").replace(/\s+/g, "_").toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Exported");
  } catch {
    showToast("Export failed", "danger");
  }
}

function triggerImport() {
  importInputRef.value?.click?.();
}

function onImportFile(e) {
  const file = e.target?.files?.[0];
  if (!file) return;

  const fr = new FileReader();
  fr.onload = async () => {
    try {
      const parsed = safeJsonParse(String(fr.result || ""));
      const payloadRaw = parsed?.payload ? parsed.payload : parsed;
      const payload = normalizePayload(payloadRaw);

      const sourceFormId = parsed?.sourceFormId ?? parsed?.source_form_id ?? null;
      if (!sourceFormId) return showToast("Import JSON ต้องมี sourceFormId", "danger");

      const activetoggle = Number(parsed?.activetoggle ?? 0) ? 1 : 0;

      await apiUpsert({
        sourceFormId,
        source_form_id: sourceFormId,
        name: String(parsed?.name || payload?.meta?.title || "Imported template"),
        note: String(parsed?.note || ""),
        payload,
        activetoggle,
      });

      await refreshTemplates();
      showToast("Imported");
      showNiceAlert("Imported!", "Template imported successfully", "success");
    } catch (err) {
      showToast(err?.message || "Invalid JSON", "danger");
      showNiceAlert("Import failed", err?.message || "Invalid JSON", "danger");
    } finally {
      if (e.target) e.target.value = "";
    }
  };
  fr.onerror = () => {
    showToast("Failed to read file", "danger");
    showNiceAlert("Import failed", "Failed to read file", "danger");
    if (e.target) e.target.value = "";
  };
  fr.readAsText(file);
}

/* =========================
   ✅ mounted
========================= */

onMounted(async () => {
  try {
    await refreshTemplates();
  } catch (e) {
    showToast(e?.message || "Load templates failed", "danger");
  }
});
</script>

<style scoped>
/* existing base */
.tplPage {
  width: 100%;
  height: 100%;
  padding: 10px 6px;
  color: var(--txt);
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

.ghostPill {
  margin-left: 10px;
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.78);
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

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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

.miniBtn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.miniBtn.danger {
  border-color: rgba(248, 113, 113, 0.18);
}

.miniBtn.danger:hover {
  border-color: rgba(248, 113, 113, 0.35);
  background: rgba(248, 113, 113, 0.08);
}

.miniBtn.on {
  border-color: rgba(56, 189, 248, 0.22);
}
.miniBtn.off {
  border-color: rgba(248, 113, 113, 0.22);
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

.labelRow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.smallHint {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 800;
}

.emailPreview {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}

.emailRow {
  display: grid;
  gap: 8px;
}

.emailLabel {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.85);
}

.emailErr {
  font-size: 12px;
  color: rgba(248, 113, 113, 0.95);
  font-weight: 900;
}

.dangerInput {
  border-color: rgba(248, 113, 113, 0.45) !important;
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.12) !important;
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
}

.textarea {
  resize: vertical;
}

.toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.toolLeft {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 10px;
  width: min(760px, 100%);
}

@media (max-width: 900px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .toolLeft {
    grid-template-columns: 1fr;
  }
}

.toolRight {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.statPill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.18);
  background: rgba(56, 189, 248, 0.08);
  font-weight: 900;
  font-size: 12px;
}

.statPill.ghost {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1200px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 800px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.tplCard {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tplCard.inactive {
  opacity: 0.72;
  filter: saturate(0.85);
}

.tplTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.tplName {
  font-weight: 950;
  font-size: 16px;
}

.tplMeta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.metaItem {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 800;
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.tplActions {
  display: inline-flex;
  gap: 8px;
}

.tplBody {
  display: grid;
  gap: 10px;
}

/* ✅ template thumbnails */
.tplThumbs {
  /* ✅ show full image; let container grow by image ratio */
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
  align-items: start;
}
.thumbImg {
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  /* ✅ show full image (no crop) */
  object-fit: contain;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}
.thumbMore {
  justify-self: start;
  font-size: 12px;
  font-weight: 950;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.85);
}

/* ✅ images preview in modal */
.previewImgs {
  /* ✅ scale container by image ratio; stack full-width */
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
.previewImg {
  /* ✅ show full image (no crop) and let height follow image ratio */
  display: block;
  width: 100%;
  height: auto;
  border-radius: 14px;
  object-fit: contain;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

/* ✅ question images editor */
.imgBox {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  padding: 10px;
}
.imgTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.imgTitle {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  font-weight: 950;
  color: rgba(255, 255, 255, 0.88);
}
.imgActions {
  display: inline-flex;
  gap: 10px;
  align-items: center;
}
.imgAddRow {
  display: grid;
  grid-template-columns: 1fr 34px 34px;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}
.imgGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
@media (max-width: 800px) {
  .imgGrid {
    grid-template-columns: 1fr;
  }
}
.imgTile {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.14);
  padding: 10px;
  display: grid;
  gap: 8px;
}
.imgPreview {
  /* ✅ show full image (no crop) and let container grow by image ratio */
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}
.imgBtns {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}
.imgUrlInput {
  font-size: 12px;
}
.imgEmpty {
  padding: 10px;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.65);
  font-weight: 900;
  text-align: center;
}

/* ✅ score icon picker (preview) */
.scorePicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.scoreIconBtn {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}
.scoreIconBtn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(56, 189, 248, 0.18);
}
.scoreIconBtn.on {
  border-color: rgba(56, 189, 248, 0.28);
  background: rgba(56, 189, 248, 0.1);
}
.scoreValue {
  font-weight: 950;
  color: rgba(255, 255, 255, 0.85);
  padding-left: 6px;
}

/* ✅ score icon picker (edit) */
.iconPick {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.iconPickBtn {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}
.iconPickBtn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(56, 189, 248, 0.18);
}
.iconPickBtn.on {
  border-color: rgba(56, 189, 248, 0.28);
  background: rgba(56, 189, 248, 0.1);
}

.tplDesc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}

.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
}

.chip.ghost {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.78);
}

.dangerChip {
  border-color: rgba(248, 113, 113, 0.22) !important;
  background: rgba(248, 113, 113, 0.07) !important;
  color: rgba(255, 255, 255, 0.92) !important;
}

.tplFoot {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: auto;
}

.empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 20px;
}

.emptyTitle {
  font-weight: 950;
  font-size: 16px;
  display: inline-flex;
  gap: 10px;
  align-items: center;
}

.emptySub {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.5;
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
  width: min(900px, calc(100vw - 24px));
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
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.1), rgba(99, 102, 241, 0.06));
}

.overlayTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 950;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.92);
  flex-wrap: wrap;
}

.overlayBody {
  padding: 12px;
  display: grid;
  gap: 12px;
}

.overlayActions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.jsonPre {
  margin: 0;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.22);
  max-height: 420px;
  overflow: auto;
  color: rgba(255, 255, 255, 0.78);
  font-size: 11px;
  line-height: 1.45;
}

/* modal toggle */
.activeRow {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.toggleBtn {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.92);
  border-radius: 14px;
  padding: 10px 12px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 900;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}

.toggleBtn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(56, 189, 248, 0.18);
}

.toggleBtn.on {
  border-color: rgba(56, 189, 248, 0.22);
  background: rgba(56, 189, 248, 0.08);
}

/* ✅ smaller toggle used for Required */
.smallToggle {
  padding: 8px 10px;
  border-radius: 12px;
  font-size: 12px;
  gap: 8px;
}

.activeHint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 800;
}

/* toast */
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
  transition: opacity 160ms ease, transform 160ms ease;
}

.toast.show {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.toast.danger {
  border-color: rgba(248, 113, 113, 0.28);
}

.hiddenInput {
  display: none;
}

/* ✅ Editor modal */
.editorCard {
  width: min(1020px, calc(100vw - 24px));
}

/* ✅ Link prompt overlay */
.linkCard {
  width: min(560px, calc(100vw - 24px));
}

.linkMetaRow {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.linkMetaRow .ghostPill {
  margin-left: 0;
}

.topBtns {
  display: inline-flex;
  gap: 10px;
  align-items: center;
}

.editorBody {
  max-height: calc(100vh - 140px);
  overflow: auto;
}

.loadingRow {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  padding: 12px;
  color: rgba(255, 255, 255, 0.78);
  font-weight: 900;
}

.editorGrid {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 10px;
}

.editorSpan2 {
  grid-column: 1 / -1;
}

.innerCard {
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.innerTitle {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  font-weight: 950;
  color: rgba(255, 255, 255, 0.92);
  margin-bottom: 10px;
}

.innerTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.innerActions {
  display: inline-flex;
  gap: 10px;
  align-items: center;
}

.smallSelect {
  padding: 8px 10px;
  border-radius: 12px;
}

.qList {
  display: grid;
  gap: 10px;
}

.qItem {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.14);
  padding: 10px;
}

.qHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.qLeft {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.qRight {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.qIndex {
  font-weight: 950;
  color: rgba(255, 255, 255, 0.85);
}

.qBody {
  margin-top: 10px;
  display: grid;
  gap: 10px;
}

.optBox {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  padding: 10px;
}

.optTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.optTitle {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  font-weight: 950;
  color: rgba(255, 255, 255, 0.88);
}

.optList {
  display: grid;
  gap: 8px;
}

.optRow {
  display: grid;
  grid-template-columns: 1fr 34px 34px;
  gap: 8px;
  align-items: center;
}

.optInput {
  padding: 10px 12px;
}

.miniSettings {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.emptyInner {
  padding: 12px;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.65);
  font-weight: 900;
  text-align: center;
}

/* ✅ Smooth overlay animation */
.overlayFade-enter-active,
.overlayFade-leave-active {
  transition: opacity 220ms ease;
}
.overlayFade-enter-from,
.overlayFade-leave-to {
  opacity: 0;
}
.overlayFade-enter-from .overlayCard {
  transform: translateY(10px) scale(0.99);
  opacity: 0;
}
.overlayFade-enter-active .overlayCard,
.overlayFade-leave-active .overlayCard {
  transition: transform 220ms ease, opacity 220ms ease;
}
.overlayFade-leave-to .overlayCard {
  transform: translateY(10px) scale(0.99);
  opacity: 0;
}

/* ✅ Preview page styles */
.previewWrap {
  display: grid;
  gap: 12px;
}
.previewHeader {
  display: grid;
  gap: 10px;
}
.previewTitleRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.previewTitle {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  font-weight: 950;
  color: rgba(255, 255, 255, 0.92);
  font-size: 15px;
}
.previewMeta {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.previewDesc {
  color: rgba(255, 255, 255, 0.74);
  line-height: 1.5;
  font-size: 12px;
}
.previewFlags {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}

.previewList {
  display: grid;
  gap: 12px;
}
.previewQ {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.14);
  padding: 12px;
  display: grid;
  gap: 10px;
}
.previewQTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.previewQTitle {
  font-weight: 950;
  color: rgba(255, 255, 255, 0.92);
  display: inline-flex;
  gap: 8px;
  align-items: center;
}
.qNum {
  color: rgba(255, 255, 255, 0.78);
}
.req {
  color: rgba(248, 113, 113, 1);
  font-weight: 950;
}
.previewQDesc {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  line-height: 1.5;
}
.previewField {
  display: grid;
  gap: 8px;
}

.previewChoices {
  display: grid;
  gap: 8px;
}
.choiceRow {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  color: rgba(255, 255, 255, 0.84);
  font-weight: 800;
}

.uploadRow {
  display: grid;
  gap: 8px;
}
.uploadHint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 800;
}

.scoreRow {
  display: inline-flex;
  gap: 10px;
  align-items: center;
}
.scoreHint {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 900;
}

.tableWrap {
  overflow: auto;
}
.gridTable {
  width: 100%;
  border-collapse: collapse;
  min-width: 520px;
}
.gridTable th,
.gridTable td {
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px;
  text-align: center;
}
.gridTable th {
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 950;
}
.rowHead {
  text-align: left !important;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.85);
}
.cell input {
  transform: scale(1.05);
}

/* ✅ date/time picker clickable container */
.pickerWrap {
  border-radius: 14px;
  cursor: pointer;
}
.pickerInput {
  cursor: pointer;
}

/* ✅ NICE ALERT */
.niceAlert {
  position: fixed;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100000;
  width: min(520px, calc(100vw - 24px));
  border-radius: 18px;
  padding: 12px 12px;
  display: grid;
  grid-template-columns: 36px 1fr 34px;
  gap: 10px;
  align-items: center;
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: rgba(8, 12, 28, 0.78);
  backdrop-filter: blur(12px);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
}
.niceAlert.success {
  border-color: rgba(34, 197, 94, 0.22);
}
.niceAlert.danger {
  border-color: rgba(248, 113, 113, 0.28);
}
.niceAlertIcon {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.16);
  color: rgba(255, 255, 255, 0.92);
}
.niceAlert.success .niceAlertIcon {
  background: rgba(34, 197, 94, 0.14);
  border-color: rgba(34, 197, 94, 0.18);
}
.niceAlert.danger .niceAlertIcon {
  background: rgba(248, 113, 113, 0.12);
  border-color: rgba(248, 113, 113, 0.18);
}
.niceAlertTitle {
  font-weight: 950;
  color: rgba(255, 255, 255, 0.95);
  font-size: 13px;
  line-height: 1.2;
}
.niceAlertSub {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.35;
}
.niceAlertClose {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
}
.niceAlertClose:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-1px);
}

/* ✅ alert transition */
.alertPop-enter-active,
.alertPop-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}
.alertPop-enter-from,
.alertPop-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}
</style>
