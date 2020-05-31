let changeColor = document.getElementById("changeColor")

var makeRequest = function (url, method) {
  // Create the XHR request
  var request = new XMLHttpRequest()

  // Return it as a Promise
  return new Promise(function (resolve, reject) {
    // Setup our listener to process compeleted requests
    request.onreadystatechange = function () {
      // Only run if the request is complete
      if (request.readyState !== 4) return

      // Process the response
      if (request.status >= 200 && request.status < 300) {
        // If successful
        resolve(request)
      } else {
        // If failed
        reject({
          status: request.status,
          statusText: request.statusText,
        })
      }
    }

    // Setup our HTTP request
    request.open(method || "GET", url, true)

    // Send the request
    request.send()
  })
}

function convertToCSV(items) {
  var lines = ""
  items.forEach((element) => {
    let line = element.join(",")
    lines += line + "\r\n"
  })

  return lines
}

function getArticlesList(articles) {
  let formattedArticles = articles.map((item) => {
    let title = item.title !== null ? item.title.replace(/[”“"]/g, "") : ""
    let journalName =
      item.journalName !== null ? item.journalName.replace(/[”“"]/g, "") : ""
    let articleType =
      item.activitySubtype === 1
        ? "Article"
        : item.activitySubtype === 5
        ? "Book Review"
        : "Other"

    return {
      DOI: `${item.digitalObjectIdentifier}`,
      Title: `${title}`,
      Journal: `${journalName}`,
      Year: `${item.journalYear}`,
      Type: `${articleType}`,
    }
  })

  return formattedArticles
}

function getBooksList(books) {
  let formattedBooks = books.map((item) => {
    let title = item.title !== null ? item.title.replace(/[”“"]/g, "") : ""
    return {
      DOI: ``,
      Title: `${title}`,
      Journal: ``,
      Year: `${item.activityYear}`,
      Type: `Book`,
    }
  })

  return formattedBooks
}

function getBookChapters(bookChapters) {
  let formattedBookChapters = bookChapters.map((item) => {
    let title = item.name !== null ? item.name.replace(/[”“"]/g, "") : ""
    return {
      DOI: ``,
      Title: `${title}`,
      Journal: ``,
      Year: `${item.activityYear}`,
      Type: `Book Chapter`,
    }
  })

  return formattedBookChapters
}

function getConferenceProceedings(conferenceProceedings) {
  let formattedConferenceProceedings = conferenceProceedings.map((item) => {
    let title = item.title !== null ? item.title.replace(/[”“"]/g, "") : ""
    return {
      DOI: ``,
      Title: `${title}`,
      Journal: ``,
      Year: `${item.journalYear}`,
      Type: `Conference Proceedings`,
    }
  })

  return formattedConferenceProceedings
}

function compareDates(a, b) {
  const yearA = a.Year
  const yearB = b.Year

  let comparison = 0
  if (yearA > yearB) {
    comparison = 1
  } else if (yearA < yearB) {
    comparison = -1
  }
  return comparison
}

function createCSVFromResult(result) {
  let header = ["DOI", "Title", "Journal", "Year", "Type"]

  let items = [
    ...getArticlesList(result.articles),
    ...getBooksList(result.books),
    ...getBookChapters(result.bookChapters),
    ...getConferenceProceedings(result.conferenceProceedings),
  ]

  let checkItems = items.filter((item) => {
    return item.DOI !== ""
  })

  let doiPromises = checkItems.map((item) => {
    return makeRequest(`https://permissions.shareyourpaper.org/doi/${item.DOI}`)
  })

  Promise.all(doiPromises).then((values) => {})

  items.sort(compareDates)

  var wb = XLSX.utils.book_new()
  var ws = XLSX.utils.json_to_sheet(items, { header })
  XLSX.utils.book_append_sheet(wb, ws, "test")
  XLSX.writeFile(
    wb,
    `${result.firstName.toLowerCase()}-${result.lastName.toLowerCase()}.xlsx`
  )
}

chrome.storage.sync.get("color", function (data) {
  changeColor.style.backgroundColor = data.color
  changeColor.setAttribute("value", data.color)
})

changeColor.onclick = function (element) {
  let color = element.target.value
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let urlParts = tabs[0].url.split("/")
    var professorIDIndex = urlParts.findIndex((part) => part === "stack") + 1

    var req = makeRequest(
      `https://missouri.discovery.academicanalytics.com/api/people/${urlParts[professorIDIndex]}`
    ).then((result) => {
      console.log("result: ", result.response)
      createCSVFromResult(JSON.parse(result.response))
    })

    chrome.tabs.executeScript(tabs[0].id, {
      code: 'document.body.style.backgroundColor = "' + color + '";',
    })
  })
}
