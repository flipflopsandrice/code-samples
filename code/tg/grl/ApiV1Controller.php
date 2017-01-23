<?php

class ApiV1Controller extends BaseController
{
    public function showItemDelete($id)
    {
        $user  = $this->fbGetUser();
        $items = DB::table('item')->where('id', $id)->where('user_id', $user["id"])->get();

        foreach ($items as $item) {
            if (strlen($item->photo)) {
                foreach (glob(public_path() . "/img/item/*" . $item->photo) as $match) {
                    @unlink($match);
                }
            }

            DB::table('item')->where('id', $item->id)->delete();
        }

        return Response::json(count($items) > 0);
    }

    public function showBrowse()
    {
        $TEST_MODE = false;

        $except     = Input::get('except', "");
        $user       = $this->fbGetUser();
        $loc        = $this->getLocation();
        $friends    = $this->fbGetFriends();
        $friend_ids = []; //TODO get from $friends

        $select_fields = ['id', 'name', 'public', 'photo'];

        if (count($friends["data"])) {
            foreach ($friends["data"] as $friend) {
                $friend_ids[] = $friend["id"];
            }
        }

        $query = Item::where('user_id', $TEST_MODE ? "=" : '!=', $user["id"]);

        /* Ignore exceptions */
        if ($except && ($except = explode(",", $except)) && count($except)) {

            $except = array_filter($except, function ($value) {
                return intval($value);
            });

            count($except) && $query->whereNotIn('id', $except);
        }

        /* Ignore not interested in */
        $query->whereNotIn('id', function ($q) use ($user) {
            $q->from('interest')
                ->select('item_id')
                ->where('user_id', $user["id"])
                ->get();
        });

        /* Get public or friends only */
        $query->where('public', '=', '1');
        if (count($friend_ids)) {
            $query->orWhere(function ($q) use ($friend_ids) {
                $q->whereIn('user_id', $friend_ids);
            });
        }

        /* Sort by distance */
        if (($location = $this->getLocation())) {
            $select_fields = array_merge($select_fields, [DB::raw('ROUND(CALCULATE_DISTANCE(' . $location["latitude"] . ',' . $location["longitude"] . ',latitude,longitude),1) as distance')]);
            $query->orderBy('distance');
        } else {
            $query->orderBy(DB::raw('RAND()'));
        }

        $items = $query->get($select_fields)->take(20);

        foreach ($items as $item) {

            $item["photo"] = $this->getItemPhoto($item);

            /* Distance */
            if ($loc && $item["latitude"] > 0 && $item["longitude"] > 0) {

                $item["distance"] = GeoHelper::distance($item["latitude"], $item["longitude"], $loc["latitude"], $loc["longitude"]);
            }
        }

        return Response::json($items);
    }

    public function showPick($id)
    {
        $user = $this->fbGetUser();

        if (!$user) {
            return Response::json(false);
        }

        $chat_count_before = count($this->getMatches($user["id"]));

        $pick = Input::get('pick', false);

        $existing = Interest::where("user_id", $user["id"])->where("item_id", $id)->first();

        if (!$existing) {
            Interest::create([
                "id"         => "",
                "user_id"    => $user["id"],
                "item_id"    => $id,
                "interested" => $pick
            ]);
        } else {
            $existing->interested = $pick;
            $existing->save();
        }

        $chat_count_after = count($this->getMatches($user["id"]));

        if ($chat_count_after > $chat_count_before) {
            // Get last match and notify both users

            $matches    = $this->getMatches($user["id"]);
            $last_match = array_shift($matches);

            Mail::send('emails.chat', ['key' => 'value'], function ($message) use ($user) {
                $message->to($user["email"], $user["first_name"])->subject('Nieuwe ruil-match!');
                $message->from("info@thorongil.com", "Geruil.nl (preview)");
            });

            Mail::send('emails.chat', ['key' => 'value'], function ($message) use ($last_match) {
                $message->to($last_match->email, $last_match->first_name)->subject('Nieuwe ruil-match!');
                $message->from("info@thorongil.com", "Geruil.nl (preview)");
            });

        }

        return Response::json(true);
    }

    public function showChatSend($user_id)
    {

        $success = false;
        $message = Input::get('message');

        if ($user_id && $message) {
            $user = $this->fbGetUser();
            $arr  = [$user["id"], $user_id];
            sort($arr);
            $pusherer_room = md5("pusherer_room_" . implode("_", $arr));

            $msg = Message::create([
                'from_id' => $user["id"],
                'to_id'   => $user_id,
                'message' => $message
            ]);

            $data = $this->getFullMessage($msg->id);

            $success = Pusherer::trigger($pusherer_room, 'new-message', $data);
        }

        return Response::json($success);

    }

    public function showItemConfirm($id)
    {
        $user     = $this->fbGetUser();
        $interest = Interest::where('item_id', '=', $id)->where('user_id', '=', $user["id"])->first();

        if ($interest) {
            $interest->confirmed = !$interest->confirmed;
            $interest->save();

            $item = Item::find($interest->item_id);
            $arr  = [$user["id"], $item->user_id];
            sort($arr);
            $pusherer_room = md5("pusherer_room_" . implode("_", $arr));

            Pusherer::trigger($pusherer_room, 'item-confirmed', [
                'id' => $id
            ]);

        }

        return Response::json($interest ? $interest->confirmed : false);
    }

    public function showFeedbackPost()
    {
        $feedback = Input::get('feedback', false);
        $success  = false;

        if ($feedback && strlen($feedback) && ($user = $this->fbGetUser())) {
            $new           = new Feedback();
            $new->user_id  = $user["id"];
            $new->feedback = $feedback;
            $new->save();

            if (App::environment("production", "staging")) {
                /** redacted */
            }

            $success = true;
        }

        return Response::json($success);
    }
}
