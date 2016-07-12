<?php

namespace backend\exceptions;

use yii\base\Exception;

class InvalidZipException extends Exception
{
    const MESSAGE_INVALID_FILE                     = "Invalid ZIP file";
    const MESSAGE_COULD_NOT_READ                   = "Could not read ZIP file";
    const MESSAGE_LANGUAGE_FILE_MISSING_OR_INVALID = "Language.txt missing or invalid";
    const MESSAGE_INVALID_LABEL                    = "'%s' is not a valid label";
    const MESSAGE_INVALID_CARRIER                  = "'%s' is not a valid carrier";
    const MESSAGE_INVALID_TRACK                    = "'%s' is not a valid track";
    const MESSAGE_CARRIER_MISSING_DESCRIPTIONS     = "'%s' is missing or invalid cd descriptions";
    const MESSAGE_CARRIER_MISSING_TRACKS           = "'%s' is missing or invalid track descriptions";
    const MESSAGE_CARRIER_MISSING_INLAY            = "'%s' is missing or invalid inlay";
    const MESSAGE_SAVE_ERROR                       = "Could not save, missing or invalid data";
}
