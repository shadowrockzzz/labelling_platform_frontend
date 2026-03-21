class ProjectDetailPage {
  get pageTitle()          { return $('[data-testid="project-title"]'); }

  // Tabs
  get overviewTab()        { return $('[data-testid="tab-overview"]'); }
  get teamTab()            { return $('[data-testid="tab-team"]'); }
  get annotateTab()        { return $('[data-testid="tab-annotate"]'); }
  get reviewTab()          { return $('[data-testid="tab-review"]'); }
  get allAnnotationsTab()  { return $('[data-testid="tab-all-annotations"]'); }
  get settingsTab()        { return $('[data-testid="tab-settings"]'); }

  // Annotate tab
  get startAnnotatingBtn() { return $('[data-testid="start-annotating-btn"]'); }
  get taskIdDisplay()      { return $('[data-testid="current-task-id"]'); }
  get skipTaskBtn()        { return $('[data-testid="skip-task-btn"]'); }
  get submitTaskBtn()      { return $('[data-testid="submit-task-btn"]'); }
  get noTasksMessage()     { return $('[data-testid="no-tasks-message"]'); }

  // Review tab
  get startReviewingBtn()  { return $('[data-testid="start-reviewing-btn"]'); }
  get reviewerLevelText()  { return $('[data-testid="reviewer-level-display"]'); }
  get approveBtn()         { return $('[data-testid="approve-btn"]'); }
  get rejectBtn()          { return $('[data-testid="reject-btn"]'); }
  get rejectCommentInput() { return $('[data-testid="reject-comment-input"]'); }
  get confirmRejectBtn()   { return $('[data-testid="confirm-reject-btn"]'); }
  get noReviewsMessage()   { return $('[data-testid="no-reviews-message"]'); }

  // All Annotations tab
  get allAnnotationsTable(){ return $('[data-testid="all-annotations-table"]'); }
  get allAnnotationsRows() { return $$('[data-testid="annotation-row"]'); }
  get statusFilter()       { return $('[data-testid="status-filter"]'); }
  get viewAnnotationBtns() { return $$('[data-testid="view-annotation-btn"]'); }

  async open(projectId) {
    await browser.url(`/projects/${projectId}`);
    await this.pageTitle.waitForDisplayed({ timeout: 5000 });
  }

  async clickTab(tabName) {
    const tabMap = {
      overview:        this.overviewTab,
      team:            this.teamTab,
      annotate:        this.annotateTab,
      review:          this.reviewTab,
      "all-annotations": this.allAnnotationsTab,
      settings:        this.settingsTab,
    };
    const tab = tabMap[tabName];
    if (!tab) {
      throw new Error(`Unknown tab: ${tabName}`);
    }
    await tab.click();
    await browser.pause(300);
  }
}

module.exports = new ProjectDetailPage();