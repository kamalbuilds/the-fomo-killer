
import BigNumber from 'bignumber.js'
import { base } from 'wagmi/chains'

BigNumber.config({
  EXPONENTIAL_AT: [-20, 40],
  groupSeparator: ',',
  groupSize: 3,
})



export const formatCreateTime = (timestamp, t) => {
  const num = (Date.now() - timestamp) / 1000
  if (num < 60) {
    return t('just_now')
  }
  if (num < 3600) {
    return parseInt(num / 60) + ' ' + t('minutes_ago')
  }
  if (num < 3600 * 24) {
    return parseInt(num / 3600) + ' ' + t('hours_ago')
  }
  return new Date(timestamp).toLocaleString(window.localStorage.getItem('define_lang') || 'en')
}

export const formatAmount = (amount, decimal) => {
  if (amount === undefined) {
    return;
  }
  if (!decimal) {
    return new BigNumber(amount).toFormat()
  }
  return new BigNumber(new BigNumber(amount).div(new BigNumber(10).pow(decimal))).dp(18)
}

export const formatAmountWithDecimal = (amount, decimal = 18, place = 3) => {
  if (amount === undefined) {
    return;
  }
  return new BigNumber(new BigNumber(new BigNumber(amount).div(new BigNumber(10).pow(decimal))).toFixed(6)).toFormat(place, 1)
}

export const weiPlus = (value1, value2) => {
  return new BigNumber(new BigNumber(value1 ? value1 : 0).plus(new BigNumber(value2 ? value2 : 0)).toFixed(6)).toNumber().toString()
}


export const weiDiv = (value1, value2) => {
  if (value1 == 0 || value2 == 0) {
    return 0
  }
  return new BigNumber(new BigNumber(value1).dividedBy(new BigNumber(value2)).toFixed(6)).multipliedBy(100).toString()
};

export const floatMul = (arg1, arg2) => {
  var m = 0, s1 = arg1.toString(), s2 = arg2.toString();
  try { m += s1.split(".")[1].length } catch (e) { }
  try { m += s2.split(".")[1].length } catch (e) { }
  return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
}

export const abbrTxHash = (value, startLength = 6, endLength = 6) => {
  if (!value) {
    return value
  }
  return value.substr(0, startLength) + '...' + value.substr(-endLength)
}


export const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
}

export const formatAddress = (address,len = 4) => {
  if (!address) return '';
  return `${address.slice(0, len)}...${address.slice(-len)}`;
};

export const openLink = (url) => {
  window.open(url,'_blank')
}

export const capitalizeFirstLetter = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const sleep = (ms)=> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), ms)
  })
}

export const isBaseChain = (cId) => {
    return cId  === base.id
}

export const truncateToDecimals = (value, num = 2) => {
  if (typeof value !== 'number' && typeof value !== 'string') return value;
  let n = Number(value);
  if (isNaN(n)) return value;
  const factor = Math.pow(10, num);
  return Math.trunc(n * factor) / factor;
}


export const maxText = (text, maxLength) => {
  if (typeof text !== 'string') return '';

  return text.length > maxLength
    ? text.slice(0, maxLength) + '...'
    : text;
}


  export const enrichAgentCategoriesWithMcpNames = (agents) => {
    return agents.map(agent => {
      const mcpNames =
        agent?.mcpWorkflow?.mcps?.map(mcp => mcp.name) || []

      // 去重合并 categories + mcpNames
      const mergedCategories = Array.from(
        new Set([...(agent.categories || []), ...mcpNames])
      )

      return {
        ...agent,
        categories: mergedCategories,
      }
    })
  }
