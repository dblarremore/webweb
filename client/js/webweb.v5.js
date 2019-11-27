/*
 * webweb makes pretty interactive network diagrams in your browser
 *
 * Daniel Larremore + Contributors
 * daniel.larremore@colorado.edu
 * http://github.com/dblarremore/webweb
 * Comments and suggestions always welcome.
 *
 */

import { Webweb } from './webweb.v6'

////////////////////////////////////////////////////////////////////////////////
// initializeWebweb
////////////////////////////////////////////////////////////////////////////////
window.onload = function() {
  const webweb = new Webweb(window.wwdata)
}
