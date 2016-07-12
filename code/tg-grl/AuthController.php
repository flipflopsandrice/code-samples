<?php

class AuthController extends BaseController
{
    public function showCheck()
    {
        $code       = Input::get('code');
        $loginError = $this->fbLogin($code);

        if (!$loginError) {
            $user = $this->fbGetUser();

            if (!isset($user["invited_at"]) || strtotime($user["invited_at"]) > time()) {
                Session::flush();

                return Redirect::to('/invite?redirect=1');
            }

            return Redirect::to('/items');
        } else {
            return $loginError;
        }
    }

    public function showLogout()
    {
        Session::flush();

        return Redirect::to('/');
    }

}
