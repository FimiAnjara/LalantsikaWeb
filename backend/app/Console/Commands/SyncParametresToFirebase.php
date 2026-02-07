<?php

namespace App\Console\Commands;

use App\Http\Controllers\SyncController;
use Illuminate\Console\Command;

class SyncParametresToFirebase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync:parametres';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchroniser les paramètres non synchronisés vers Firebase';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $controller = new SyncController(app('App\Services\Firebase\FirebaseRestService'));
        $response = $controller->syncParametresToFirebase();
        
        $data = json_decode($response->getContent(), true);
        
        if ($data['success']) {
            $this->info('✅ Synchronisation réussie!');
            $this->info("   Total: {$data['data']['total']}");
            $this->info("   Synchronisés: {$data['data']['synced']}");
            $this->info("   Échoués: {$data['data']['failed']}");
        } else {
            $this->error('❌ Erreur lors de la synchronisation');
            $this->error($data['message']);
            if (isset($data['error'])) {
                $this->error($data['error']);
            }
        }

        return $data['success'] ? 0 : 1;
    }
}
