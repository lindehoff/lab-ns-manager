"use strict"
const exec = require('child_process').exec;
const namedRegexp = require("named-js-regexp");
const util = require('util');
const re=namedRegexp("ttl = (?<ttl>\\d+)[\\s\\S]*serial = (?<serial>\\d+)[\\s\\S]*refresh = (?<refresh>\\d+)[\\s\\S]*retry = (?<retry>\\d+)[\\s\\S]*expire = (?<expire>\\d+)[\\s\\S]*minimum = (?<minimum>\\d+)");

function isEquivalent(a, b) {
    // Create arrays of property names
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length != bProps.length) {
        return false;
    }

    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];

        // If values of same property are not equal,
        // objects are not equivalent
        if (a[propName] !== b[propName]) {
            return false;
        }
    }

    // If we made it this far, objects
    // are considered equivalent
    return true;
}
module.exports = function checkNameServers(domain, ip1, ip2, cb){
  const nslookup = 'nslookup -q=SOA -debug -timeout=1 -retry=1 %s %s';
  exec(util.format(nslookup, domain, ip1), (error, stdout, stderr) => {
    if (error) {
      cb(error);
      return;
    }
    const matches_array = re.execGroups(stdout);
    if (!matches_array) {
      cb(stdout);
      return;
    }
    exec(util.format(nslookup, domain, ip2), (error, stdout, stderr) => {
      if (error) {
        cb(error);
        return;
      }
      const matches_array2 = re.execGroups(stdout);
      if (!matches_array2) {
        cb(stdout);
        return;
      }
      if(isEquivalent(matches_array, matches_array2)){
        cb(null, matches_array);
      } else {
        cb(new Error("The SOA record on the two name server do not match"));
      }
    });

  });
}
