__author__ = 'Christian'

import sqlite3
import sys, getopt, os


class NotDirectoryError(Exception):
  pass

def imageDirectoryToDatabase(directory, databaseFilename):
  if not os.path.isdir(directory):
    raise NotDirectoryError("The directory is actually no directory")

  conn = sqlite3.connect(databaseFilename)

  c = conn.cursor()

  try:
    c.execute('''CREATE TABLE "Images" ("id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE ,
                                      "caseId" INTEGER NOT NULL , "imageId" INTEGER NOT NULL )''')
  except sqlite3.OperationalError:
    pass

  currentFiles = [f for f in os.listdir(directory) if f.endswith('gif')]
  added = {}
  for f in currentFiles:
    # Case11_16_after.gif
    splitted = f.split('_')
    caseID = splitted[0].replace('Case', '')
    needleImageID = splitted[1]

    if not caseID in added.keys():
      added[caseID] = []

    if needleImageID not in added[caseID]:
      print "INSERT INTO Images VALUES (NULL," + caseID + "," + needleImageID
      c.execute("INSERT INTO Images VALUES (NULL,'" + caseID + "','" + needleImageID + "')")
      added[caseID].append(needleImageID)

  conn.commit()
  conn.close()


def main(argv):
  directory = ''
  filename = 'database.db'
  try:
    opts, args = getopt.getopt(argv,"d:f:?",["help","directory=","file="])
  except getopt.GetoptError:
    print 'helpers.py -d <imageDirectory> -f <databaseFile>'
    sys.exit(2)
  for opt, arg in opts:
    if opt in ("-?", "--help"):
       print 'helpers.py -d <imageDirectory> -f <databaseFile>'
       sys.exit()
    elif opt in ("-d", "--directory"):
       directory = arg
    elif opt in ("-f", "--file"):
       filename = arg
  if not directory :
   print 'directory not set'
   return
  else:
   print 'Directory to explore is: ', directory

   imageDirectoryToDatabase(directory=directory, databaseFilename=filename)

if __name__ == "__main__":
   main(sys.argv[1:])


