// The marketing page links to "07-tap-page-sample.html" (its file name in design/); send visitors to the live sample.
export default defineEventHandler(event => sendRedirect(event, '/cafeluna', 302))
