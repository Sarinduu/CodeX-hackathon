'use strict'
module.exports = function problem(res, code, title, detail, extra = {}) {
  return res.status(code).json(
    { 
        type: 'about:blank', 
        title, status: code, 
        detail, ...extra
    })
}