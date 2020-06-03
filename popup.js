let downloadButton = document.getElementById("downloadButton")
let spinnerContainer = document.getElementById("spinnerContainer")
let loadingMessage1 = document.getElementById("loadingMessage1")
let loadingMessage2 = document.getElementById("loadingMessage2")

let showDiv = document.getElementById("showDiv")
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
  if (yearA < yearB) {
    comparison = 1
  } else if (yearA > yearB) {
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

  items.sort(compareDates)

  var wb = XLSX.utils.book_new()
  var wsOne = XLSX.utils.json_to_sheet(items, { header })
  let wsOneName = `Discovery Works of ${result.firstName} ${result.lastName}`.substring(
    0,
    31
  )
  XLSX.utils.book_append_sheet(wb, wsOne, wsOneName)

  let checkItems = items.filter((item) => {
    return item.DOI !== ""
  })

  let doiPromises = checkItems.map((item) => {
    return makeRequest(`https://permissions.shareyourpaper.org/doi/${item.DOI}`)
  })

  loadingMessage1.style.display = "none"
  loadingMessage2.style.display = "block"

  Promise.all(doiPromises).then((values) => {
    let checkerHeaders = [
      "DOI",
      "You Can Archive",
      "Version(s) archivable",
      "Archiving Locations Allowed",
      "Post-Print Embargo",
      "Licence(s) Allowed",
      "Deposit Statement",
      "Policy used",
      "Issuer Name",
      "Policy Full Text",
      "Record Last Updated",
      "Policy monitoring",
    ]

    let checkItemsList = values.map((value) => {
      let response = JSON.parse(value.response)

      if (response.authoritative_permission) {
        return {
          DOI: `${response.authoritative_permission.application.can_archive_conditions.doi}`,
          "You Can Archive": `${response.authoritative_permission.application.can_archive}`,
          "Version(s) archivable": `${response.authoritative_permission.application.can_archive_conditions.archiving_locations_allowed}`,
          "Archiving Locations Allowed": `${response.authoritative_permission.application.can_archive_conditions.versions_archivable}`,
          "Post-Print Embargo": `${response.authoritative_permission.application.can_archive_conditions.postprint_embargo_end_calculated}`,
          "Licence(s) Allowed": `${response.authoritative_permission.application.can_archive_conditions.licenses_required}`,
          "Deposit Statement": `${response.authoritative_permission.application.can_archive_conditions.deposit_statement_required_calculated}`,
          "Policy used": `${response.authoritative_permission.issuer.permission_type}`,
          "Issuer Name": `${response.authoritative_permission.issuer.name}`,
          "Policy Full Text": `${response.authoritative_permission.meta.policy_full_text_archived}`,
          "Record Last Updated": `${response.authoritative_permission.meta.record_last_updated}`,
          "Policy monitoring": `${response.authoritative_permission.meta.monitoring_type}`,
        }
      }
      return {}
    })

    var wsTwo = XLSX.utils.json_to_sheet(checkItemsList, { checkerHeaders })
    let wsTwoName = `OA Checked Works of ${result.firstName} ${result.lastName}`.substring(
      0,
      31
    )
    XLSX.utils.book_append_sheet(wb, wsTwo, wsTwoName)

    XLSX.writeFile(
      wb,
      `${result.firstName.toLowerCase()}-${result.lastName.toLowerCase()}.xlsx`
    )
    downloadButton.style.display = "block"
    spinnerContainer.style.display = "none"
    loadingMessage1.style.display = "none"
    loadingMessage2.style.display = "none"
  })
}

downloadButton.onclick = function (element) {
  let color = element.target.value
  downloadButton.style.display = "none"
  spinnerContainer.style.display = "block"
  loadingMessage1.style.display = "block"

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let urlParts = tabs[0].url.split("/")
    var professorIDIndex = urlParts.findIndex((part) => part === "stack") + 1

    var req = makeRequest(
      `https://missouri.discovery.academicanalytics.com/api/people/${urlParts[professorIDIndex]}`
    ).then((result) => {
      createCSVFromResult(JSON.parse(result.response))
    })

    chrome.tabs.executeScript(tabs[0].id, {
      code: 'document.body.style.backgroundColor = "' + color + '";',
    })
  })
}
