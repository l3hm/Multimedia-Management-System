FILE_UPLOAD_REQUEST = """
mutation FileUploadRequest {
  fileUploadRequest {
    id
    uploadUrl
  }
}
"""

CREATE_LIBRARY_TRACK = """
mutation LibraryTrackCreateMutation($input: LibraryTrackCreateInput!) {
  libraryTrackCreate(input: $input) {
    __typename
    ... on LibraryTrackCreateSuccess {
      createdLibraryTrack {
        id
      }
    }
    ... on LibraryTrackCreateError {
      code
      message
    }
  }
}
"""

FETCH_LIBRARY_TRACK = """
query LibraryTrackQuery($id: ID!) {
  libraryTrack(id: $id) {
    __typename

    ... on LibraryTrack {
      id
      title

      audioAnalysisV7 {
        __typename
        ... on AudioAnalysisV7Finished {
          result {
            genreTags
            moodTags
            instrumentTags
            subgenreTags
            freeGenreTags
          }
        }
      }

      audioAnalysisV6 {
        __typename
        ... on AudioAnalysisV6Finished {
          result {
            genreTags
            moodTags
            instrumentTags
            subgenreTags
            freeGenreTags
          }
        }
      }
    }

    ... on LibraryTrackNotFoundError {
      message
    }
  }
}
"""