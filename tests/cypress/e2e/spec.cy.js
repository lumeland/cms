describe("Lume CMS", () => {
  // Run a command before all tests
  before(() => {
    // cy.exec('rm -rf src/*');
  });

  it("Load homepage", () => {
    cy.visit("http://localhost:8000");
    cy.get(".header-title").should("contain", "Site name");
    cy.get(".header-description > p > a").should(
      "contain",
      "https://example.com/",
    ).and("have.attr", "href", "https://example.com/");
    cy.get(".list > li:nth-child(1) > a").should("contain", "Home");
  });

  it("Document", () => {
    const title = "New title";
    const description = "New description";
    // Go to the document
    cy.visit("http://localhost:8000");
    cy.get(".list > li:nth-child(1) > a").should("contain", "Home").click();
    cy.get("u-form").should("exist");
    // Edit the document
    cy.get("input[name='changes.title']").should("exist").clear().type(title);
    cy.get("textarea[name='changes.description']").should("exist").clear().type(
      description,
    );
    cy.get("u-form > form > footer > button[type='submit']").should("exist")
      .click();
    // Check the document
    cy.visit("http://localhost:8000/document/Home");
    cy.get("input[name='changes.title']").should("exist").should(
      "have.value",
      title,
    );
    cy.get("textarea[name='changes.description']").should("exist").should(
      "have.value",
      description,
    );
  });

  it("Uploads", () => {
    // Go to uploads
    cy.visit("http://localhost:8000");
    cy.get(".list > li:nth-child(2) > a").should("contain", "Img").click();
    cy.get(".emptyState").should("exist");

    // Upload a file
    const fileName = "file.txt";
    const mimeType = "text/plain";
    cy.get(".button.is-primary").should("exist").click();
    cy.get(".inputFile").selectFile({
      contents: Cypress.Buffer.from("file content"),
      fileName,
      mimeType,
      lastModified: Date.now(),
    });
    cy.get(".button.is-primary").should("exist").click();
    cy.get("input[name='_id']").should("exist").should("have.value", fileName);
    cy.contains("12 B").should("exist");

    // Back to uploads
    cy.get(".breadcrumb > li:nth-child(2) > a").should("exist").click();
    cy.get(".emptyState").should("not.exist");
    cy.get(".list > li:nth-child(1) > a").should("contain", fileName).click();

    // Delete the file
    cy.get("form > footer u-confirm > .buttonIcon").should("exist").click();
    cy.on("window:confirm", () => true);
    cy.get(".emptyState").should("exist");
  });
});
